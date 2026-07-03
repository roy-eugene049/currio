import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { isCategory, pickRandomCategory, type Category } from "../_shared/categories.ts";
import {
  contentHash,
  isAiGenerationEnabled,
  mapRow,
  MAX_GENERATIONS_PER_DAY,
  OPENAI_MODEL,
  PROMPT_VERSION,
  pickRandom,
  type CurioRow,
} from "../_shared/curio.ts";
import { resolveCurioImageUrl } from "../_shared/pexels.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type GenerateRequest = {
  category?: string;
  excludeTitles?: string[];
  excludeId?: string;
};

type GeneratedPayload = {
  title: string;
  content: string;
  category: string;
  readingTime: string;
};

type GenerateResult =
  | { status: "ok"; payload: GeneratedPayload }
  | { status: "quota_exceeded"; message: string }
  | { status: "failed"; message: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!isAiGenerationEnabled()) {
    return json({ error: "AI generation is not enabled" }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: GenerateRequest = {};
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    body = {};
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const startedAt = Date.now();

  try {
    const [{ data: interests }, { data: seen }] = await Promise.all([
      userClient.from("user_interests").select("category").eq("user_id", user.id),
      userClient.from("user_seen_curios").select("curio_id").eq("user_id", user.id),
    ]);

    const interestCategories = interests?.map((row) => row.category) ?? [];
    const seenIds = new Set(seen?.map((row) => row.curio_id) ?? []);
    const category = resolveCategory(body.category, interestCategories);

    const cachedAi = await pickCachedAiCurio(
      userClient,
      category,
      seenIds,
      body.excludeId,
    );
    if (cachedAi) {
      return json({ curio: mapRow(cachedAi), source: "ai_cache" });
    }

    if (await isOpenAiQuotaBlocked(serviceClient)) {
      return json({ error: "openai_quota_exceeded" }, 503);
    }

    const overLimit = await isOverDailyLimit(serviceClient, user.id);
    if (overLimit) {
      return json({ error: "Daily generation limit reached" }, 429);
    }

    const excludeTitles = body.excludeTitles ?? [];
    const generated = await generateWithOpenAI(category, excludeTitles);

    if (generated.status === "quota_exceeded") {
      await logGeneration(serviceClient, {
        userId: user.id,
        category,
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorMessage: "insufficient_quota",
      });
      return json({ error: "openai_quota_exceeded" }, 503);
    }

    if (generated.status !== "ok") {
      await logGeneration(serviceClient, {
        userId: user.id,
        category,
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorMessage: generated.message,
      });
      return json({ error: "Generation failed" }, 502);
    }

    const draft = generated.payload;
    const moderated = await moderateContent(`${draft.title}\n${draft.content}`);
    if (!moderated) {
      await logGeneration(serviceClient, {
        userId: user.id,
        category,
        status: "blocked",
        latencyMs: Date.now() - startedAt,
        errorMessage: "Moderation blocked content",
      });
      return json({ error: "Content blocked" }, 422);
    }

    const hash = await contentHash(draft.title, draft.content);
    const existing = await findCurioByHash(serviceClient, hash);
    if (existing) {
      return json({ curio: mapRow(existing), source: "dedupe" });
    }

    const curioId = `ai_${crypto.randomUUID()}`;
    const imageUrl = await resolveCurioImageUrl({
      id: curioId,
      title: draft.title,
      content: draft.content,
      category: draft.category,
    });

    const { data: inserted, error: insertError } = await serviceClient
      .from("curios")
      .insert({
        id: curioId,
        source: "ai",
        category: draft.category,
        title: draft.title,
        content: draft.content,
        reading_time: draft.readingTime,
        image_url: imageUrl,
        content_hash: hash,
        model: OPENAI_MODEL,
        prompt_version: PROMPT_VERSION,
        locale: "en",
        is_published: true,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      if (insertError?.code === "23505") {
        const deduped = await findCurioByHash(serviceClient, hash);
        if (deduped) {
          return json({ curio: mapRow(deduped), source: "dedupe" });
        }
      }

      await logGeneration(serviceClient, {
        userId: user.id,
        category,
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorMessage: insertError?.message ?? "Insert failed",
      });
      return json({ error: "Could not save curio" }, 500);
    }

    await logGeneration(serviceClient, {
      userId: user.id,
      curioId: inserted.id,
      category,
      status: "ok",
      latencyMs: Date.now() - startedAt,
    });

    return json({ curio: mapRow(inserted as CurioRow), source: "ai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate-curio:", message);
    return json({ error: "Generation failed" }, 500);
  }
});

function resolveCategory(
  requested: string | undefined,
  interests: string[],
): Category {
  if (requested && isCategory(requested)) {
    return requested;
  }
  return pickRandomCategory(interests);
}

async function pickCachedAiCurio(
  supabase: SupabaseClient,
  category: Category,
  seenIds: Set<string>,
  excludeId?: string,
): Promise<CurioRow | null> {
  const { data, error } = await supabase
    .from("curios")
    .select("*")
    .eq("is_published", true)
    .eq("locale", "en")
    .eq("source", "ai")
    .eq("category", category)
    .limit(600);

  if (error) {
    console.error("pickCachedAiCurio:", error.message);
    return null;
  }

  const unseen = ((data ?? []) as CurioRow[]).filter(
    (row) => !seenIds.has(row.id) && row.id !== excludeId,
  );
  return pickRandom(unseen);
}

async function isOverDailyLimit(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await serviceClient
    .from("curio_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ok")
    .gte("created_at", since);

  if (error) {
    console.error("isOverDailyLimit:", error.message);
    return true;
  }

  return (count ?? 0) >= MAX_GENERATIONS_PER_DAY;
}

/** Skip OpenAI calls for 24h after a quota failure (account-wide). */
async function isOpenAiQuotaBlocked(
  serviceClient: SupabaseClient,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await serviceClient
    .from("curio_generations")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .ilike("error_message", "%insufficient_quota%")
    .gte("created_at", since);

  if (error) {
    console.error("isOpenAiQuotaBlocked:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

async function generateWithOpenAI(
  category: Category,
  excludeTitles: string[],
): Promise<GenerateResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return { status: "failed", message: "OPENAI_API_KEY not set" };
  }

  const system = `You are Currio, a curator of fascinating micro-lessons.
Output ONLY valid JSON matching this schema:
{ "title": string, "content": string, "category": string, "readingTime": "1 min" }
Facts must be accurate and non-controversial. No medical or legal advice.
Tone: curious, warm, accessible to a global audience aged 16+.
Title must be at most 80 characters. Content must be 2-4 sentences and at most 320 characters.
Category MUST be exactly: ${category}`;

  const recent = excludeTitles.filter(Boolean).slice(0, 10).join("; ");
  const user = `Generate one fascinating micro-lesson about ${category}.
Avoid repeating these recent titles: ${recent || "(none)"}.
Locale: en.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText) as {
        error?: { code?: string; message?: string };
      };
      if (parsed.error?.code === "insufficient_quota") {
        return {
          status: "quota_exceeded",
          message: parsed.error.message ?? "insufficient_quota",
        };
      }
    } catch {
      // fall through
    }
    console.error("OpenAI:", errorText);
    return { status: "failed", message: "OpenAI request failed" };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    return { status: "failed", message: "Empty model output" };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.title !== "string" || typeof parsed.content !== "string") {
      return { status: "failed", message: "Invalid model JSON" };
    }

    const title = parsed.title.trim();
    const content = parsed.content.trim();
    if (!title || !content || title.length > 80 || content.length > 320) {
      return { status: "failed", message: "Model output out of bounds" };
    }

    return {
      status: "ok",
      payload: {
        title,
        content,
        category,
        readingTime: typeof parsed.readingTime === "string"
          ? parsed.readingTime
          : "1 min",
      },
    };
  } catch {
    return { status: "failed", message: "Could not parse model JSON" };
  }
}

async function moderateContent(text: string): Promise<boolean> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return false;

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text }),
  });

  if (!response.ok) {
    console.error("Moderation:", await response.text());
    return false;
  }

  const payload = (await response.json()) as {
    results?: Array<{ flagged?: boolean }>;
  };

  return payload.results?.[0]?.flagged !== true;
}

async function findCurioByHash(
  serviceClient: SupabaseClient,
  hash: string,
): Promise<CurioRow | null> {
  const { data, error } = await serviceClient
    .from("curios")
    .select("*")
    .eq("content_hash", hash)
    .maybeSingle();

  if (error || !data) return null;
  return data as CurioRow;
}

async function logGeneration(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    curioId?: string;
    category: string;
    status: "ok" | "failed" | "blocked";
    latencyMs: number;
    errorMessage?: string;
  },
): Promise<void> {
  const { error } = await serviceClient.from("curio_generations").insert({
    user_id: input.userId,
    curio_id: input.curioId ?? null,
    category: input.category,
    status: input.status,
    model: OPENAI_MODEL,
    prompt_version: PROMPT_VERSION,
    latency_ms: input.latencyMs,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.error("logGeneration:", error.message);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
