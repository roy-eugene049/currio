import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type CurioRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  reading_time: string;
  image_url: string | null;
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
      return json({ curio: mapRow(curio as CurioRow) });
    }
  }

  const curio = await pickCurio(supabase, categories, seenIds, excludeId);

  if (!curio) {
    return json({ error: "No curios available" }, 404);
  }

  return respondWithCurio(supabase, user.id, curio, mode === "daily", today);
});

function parseMode(value: string | null): FeedMode {
  return value === "next" ? "next" : "daily";
}

async function pickCurio(
  supabase: SupabaseClient,
  categories: string[],
  seenIds: Set<string>,
  excludeId?: string,
): Promise<CurioRow | null> {
  const pool = await fetchPublishedPool(supabase, categories);
  if (pool.length === 0) return null;

  const unseen = pool.filter(
    (row) => !seenIds.has(row.id) && row.id !== excludeId,
  );

  if (unseen.length > 0) {
    return pickRandom(unseen);
  }

  const repeatable = excludeId
    ? pool.filter((row) => row.id !== excludeId)
    : pool;

  return pickRandom(repeatable);
}

async function fetchPublishedPool(
  supabase: SupabaseClient,
  categories: string[],
): Promise<CurioRow[]> {
  let query = supabase
    .from("curios")
    .select("*")
    .eq("is_published", true)
    .eq("locale", "en");

  if (categories.length > 0) {
    query = query.in("category", categories);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    console.error("fetchPublishedPool:", error.message);
    return [];
  }

  return (data ?? []) as CurioRow[];
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function mapRow(row: CurioRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    readingTime: row.reading_time,
    image: row.image_url ?? null,
  };
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
