import { FEATURES } from '@/constants/features';
import { ENV } from '@/constants/env';
import { getSupabase } from '@/services/supabase';
import type { Category, Curio } from '@/types/curio';

type ApiCurioPayload = {
  id: string;
  title: string;
  content: string;
  category: string;
  readingTime: string;
  image: string | null;
};

type CurioRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  reading_time: string;
  image_url: string | null;
};

export function isRemoteCuriosEnabled(): boolean {
  return FEATURES.remoteCurios && ENV.isSupabaseConfigured;
}

function mapApiCurio(raw: ApiCurioPayload): Curio {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    category: raw.category as Category,
    readingTime: raw.readingTime,
    image: raw.image,
  };
}

function mapRow(row: CurioRow): Curio {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category as Category,
    readingTime: row.reading_time,
    image: row.image_url ?? null,
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: ENV.SUPABASE_ANON_KEY,
  };
}

async function callCurioFeed(params: URLSearchParams): Promise<Curio> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${ENV.SUPABASE_URL}/functions/v1/curio-feed?${params.toString()}`,
    { headers },
  );

  const body = (await res.json()) as { curio?: ApiCurioPayload; error?: string };

  if (!res.ok) {
    throw new Error(body.error ?? 'Feed failed');
  }

  if (!body.curio) {
    throw new Error('Feed returned no curio');
  }

  return mapApiCurio(body.curio);
}

export async function fetchDailyCurio(): Promise<Curio> {
  return callCurioFeed(new URLSearchParams({ mode: 'daily' }));
}

export async function fetchNextCurio(excludeId: string): Promise<Curio> {
  return callCurioFeed(
    new URLSearchParams({
      mode: 'next',
      excludeId,
    }),
  );
}

export async function fetchCurioById(id: string): Promise<Curio | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('curios')
    .select('id, title, content, category, reading_time, image_url')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as CurioRow);
}

export async function fetchCuriosByIds(ids: string[]): Promise<Curio[]> {
  if (ids.length === 0) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('curios')
    .select('id, title, content, category, reading_time, image_url')
    .in('id', ids)
    .eq('is_published', true);

  if (error || !data) {
    return [];
  }

  const byId = new Map((data as CurioRow[]).map((row) => [row.id, mapRow(row)]));
  return ids.map((id) => byId.get(id)).filter((curio): curio is Curio => Boolean(curio));
}
