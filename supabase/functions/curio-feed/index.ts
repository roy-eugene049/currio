import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { pickRandomCategory } from "../_shared/categories.ts";
import { isAiGenerationEnabled, mapRow, pickRandom, type CurioRow } from "../_shared/curio.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type FeedMode = "daily" | "next";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const mode = parseMode(url.searchParams.get("mode"));
  const excludeId = url.searchParams.get("excludeId") ?? undefined;
  const excludeCategoryParam = url.searchParams.get("excludeCategory") ?? undefined;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: interests }, { data: seen }, { data: appState }] =
    await Promise.all([
      supabase.from("user_interests").select("category").eq("user_id", user.id),
      supabase.from("user_seen_curios").select("curio_id").eq("user_id", user.id),
      supabase
        .from("user_app_state")
        .select("todays_curio_id, todays_curio_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const categories = interests?.map((row) => row.category) ?? [];
  const seenIds = new Set(seen?.map((row) => row.curio_id) ?? []);
  const excludeCategory =
    categories.length > 1
      ? (excludeCategoryParam ??
        (excludeId ? await resolveCurioCategory(supabase, excludeId) : undefined))
      : undefined;

  if (
    mode === "daily" &&
    appState?.todays_curio_date === today &&
    appState?.todays_curio_id
  ) {
    const { data: curio } = await supabase
      .from("curios")
      .select("*")
      .eq("id", appState.todays_curio_id)
      .eq("is_published", true)
      .maybeSingle();

    if (curio) {
      const source = (curio as CurioRow & { source?: string }).source;
      if (!isAiGenerationEnabled() || source === "ai") {
        return json({ curio: mapRow(curio as CurioRow) });
      }
    }
  }

  const curio = await pickAiFirstCurio({
    supabase,
    categories,
    seenIds,
    excludeId,
    excludeCategory,
    authHeader,
    supabaseUrl,
    supabaseAnonKey,
  });

  if (!curio) {
    return json({ error: "No curios available" }, 404);
  }

  return respondWithCurio(supabase, user.id, curio, mode === "daily", today);
});

function parseMode(value: string | null): FeedMode {
  return value === "next" ? "next" : "daily";
}

/**
 * AI-first: generate or reuse AI curios, then fall back to seeded catalog.
 */
async function pickAiFirstCurio(input: {
  supabase: SupabaseClient;
  categories: string[];
  seenIds: Set<string>;
  excludeId?: string;
  excludeCategory?: string;
  authHeader: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}): Promise<CurioRow | null> {
  if (isAiGenerationEnabled()) {
    const excludeTitles = await fetchRecentTitles(input.supabase, input.seenIds);
    const generated = await callGenerateCurio({
      authHeader: input.authHeader,
      supabaseUrl: input.supabaseUrl,
      supabaseAnonKey: input.supabaseAnonKey,
      category: pickRandomCategory(input.categories, input.excludeCategory),
      excludeTitles,
      excludeId: input.excludeId,
    });

    if (generated && generated.id !== input.excludeId) {
      return generated;
    }
  }

  return pickFromSeedPool(
    input.supabase,
    input.categories,
    input.seenIds,
    input.excludeId,
    input.excludeCategory,
  );
}

function preferDifferentCategory<T extends { category: string }>(
  candidates: T[],
  categories: string[],
  excludeCategory?: string,
): T[] {
  if (!excludeCategory || categories.length <= 1) {
    return candidates;
  }

  const otherTopics = candidates.filter((row) => row.category !== excludeCategory);
  return otherTopics.length > 0 ? otherTopics : candidates;
}

async function resolveCurioCategory(
  supabase: SupabaseClient,
  curioId: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("curios")
    .select("category")
    .eq("id", curioId)
    .maybeSingle();

  if (error) {
    console.error("resolveCurioCategory:", error.message);
    return undefined;
  }

  return data?.category;
}

async function pickFromSeedPool(
  supabase: SupabaseClient,
  categories: string[],
  seenIds: Set<string>,
  excludeId?: string,
  excludeCategory?: string,
): Promise<CurioRow | null> {
  const pool = await fetchSeedPool(supabase, categories);
  if (pool.length === 0) return null;

  const unseen = preferDifferentCategory(
    pool.filter((row) => !seenIds.has(row.id) && row.id !== excludeId),
    categories,
    excludeCategory,
  );

  if (unseen.length > 0) {
    return pickRandom(unseen);
  }

  const repeatable = preferDifferentCategory(
    excludeId ? pool.filter((row) => row.id !== excludeId) : pool,
    categories,
    excludeCategory,
  );

  return pickRandom(repeatable);
}

async function fetchSeedPool(
  supabase: SupabaseClient,
  categories: string[],
): Promise<CurioRow[]> {
  let query = supabase
    .from("curios")
    .select("*")
    .eq("is_published", true)
    .eq("locale", "en")
    .eq("source", "seed");

  if (categories.length > 0) {
    query = query.in("category", categories);
  }

  const { data, error } = await query.limit(600);

  if (error) {
    console.error("fetchSeedPool:", error.message);
    return [];
  }

  return (data ?? []) as CurioRow[];
}

async function fetchRecentTitles(
  supabase: SupabaseClient,
  seenIds: Set<string>,
): Promise<string[]> {
  const ids = [...seenIds].slice(-20);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("curios")
    .select("title")
    .in("id", ids);

  if (error) {
    console.error("fetchRecentTitles:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.title)
    .filter((title): title is string => Boolean(title));
}

async function callGenerateCurio(input: {
  authHeader: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  category: string;
  excludeTitles: string[];
  excludeId?: string;
}): Promise<CurioRow | null> {
  try {
    const response = await fetch(`${input.supabaseUrl}/functions/v1/generate-curio`, {
      method: "POST",
      headers: {
        Authorization: input.authHeader,
        apikey: input.supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: input.category,
        excludeTitles: input.excludeTitles,
        excludeId: input.excludeId,
      }),
    });

    if (!response.ok) {
      console.error("generate-curio:", response.status, await response.text());
      return null;
    }

    const body = (await response.json()) as {
      curio?: {
        id: string;
        title: string;
        content: string;
        category: string;
        readingTime: string;
        image: string | null;
      };
    };

    if (!body.curio) return null;

    return {
      id: body.curio.id,
      title: body.curio.title,
      content: body.curio.content,
      category: body.curio.category,
      reading_time: body.curio.readingTime,
      image_url: body.curio.image,
    };
  } catch (error) {
    console.error("callGenerateCurio:", error);
    return null;
  }
}

async function respondWithCurio(
  supabase: SupabaseClient,
  userId: string,
  row: CurioRow,
  isDaily: boolean,
  today: string,
) {
  const { error: seenError } = await supabase.from("user_seen_curios").upsert(
    { user_id: userId, curio_id: row.id },
    { onConflict: "user_id,curio_id" },
  );

  if (seenError) {
    console.error("user_seen_curios upsert:", seenError.message);
  }

  if (isDaily) {
    const { error: stateError } = await supabase.from("user_app_state").upsert(
      {
        user_id: userId,
        todays_curio_id: row.id,
        todays_curio_date: today,
      },
      { onConflict: "user_id" },
    );

    if (stateError) {
      console.error("user_app_state upsert:", stateError.message);
    }
  }

  return json({ curio: mapRow(row) });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
