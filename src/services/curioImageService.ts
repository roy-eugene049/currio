import { Image } from 'expo-image';

import { ENV } from '@/constants/env';
import type { Curio } from '@/types/curio';

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'need',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'from',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'that',
  'this',
  'these',
  'those',
  'your',
  'you',
  'its',
  'it',
  'they',
  'them',
  'their',
  'what',
  'which',
  'who',
  'whom',
  'with',
  'as',
  'by',
  'he',
  'she',
  'we',
  'our',
]);

const memoryCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Search terms derived from the curio itself — not the category stock pool. */
export function buildCurioImageQuery(curio: Curio): string {
  const words = curio.title
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word.toLowerCase()));

  const titleTerms = words.slice(0, 6).join(' ');
  const contentHint = curio.content
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 2)
    .join(' ');

  return [titleTerms, contentHint, curio.category].filter(Boolean).join(' ').trim();
}

async function fetchPexelsImage(
  query: string,
  page: number,
  apiKey: string,
): Promise<string | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=portrait`;
  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    photos?: Array<{ src?: { large2x?: string; large?: string; portrait?: string } }>;
  };

  const photo = data.photos?.[0]?.src;
  return photo?.large2x ?? photo?.portrait ?? photo?.large ?? null;
}

type WikimediaPage = {
  imageinfo?: Array<{ thumburl?: string; url?: string }>;
};

async function fetchWikimediaImage(query: string, pickIndex: number): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|thumburl',
    iiurlwidth: '1400',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    query?: { pages?: Record<string, WikimediaPage> };
  };

  const pages = data.query?.pages;
  if (!pages) return null;

  const results = Object.values(pages).filter((page) => page.imageinfo?.[0]);
  if (results.length === 0) return null;

  const chosen = results[pickIndex % results.length]?.imageinfo?.[0];
  return chosen?.thumburl ?? chosen?.url ?? null;
}

async function resolveRemoteImage(curio: Curio): Promise<string | null> {
  if (curio.image) return curio.image;

  const query = buildCurioImageQuery(curio);
  if (!query) return null;

  const varietyIndex = (hashString(curio.id) % 8) + 1;
  const pexelsKey = ENV.PEXELS_API_KEY;

  if (pexelsKey) {
    const pexelsUrl = await fetchPexelsImage(query, varietyIndex, pexelsKey);
    if (pexelsUrl) return pexelsUrl;
  }

  return fetchWikimediaImage(query, hashString(curio.id) % 8);
}

/**
 * Resolves a backdrop image URL unique and relevant to this curio (title/content),
 * not the generic per-category stock photo.
 */
export async function getCurioBackdropUrl(curio: Curio): Promise<string | null> {
  if (memoryCache.has(curio.id)) {
    return memoryCache.get(curio.id) ?? null;
  }

  const pending = inflight.get(curio.id);
  if (pending) return pending;

  const task = resolveRemoteImage(curio)
    .then((url) => {
      memoryCache.set(curio.id, url);
      inflight.delete(curio.id);
      return url;
    })
    .catch(() => {
      memoryCache.set(curio.id, null);
      inflight.delete(curio.id);
      return null;
    });

  inflight.set(curio.id, task);
  return task;
}

export function peekCurioBackdropUrl(curioId: string): string | null | undefined {
  if (!memoryCache.has(curioId)) return undefined;
  return memoryCache.get(curioId) ?? null;
}

const prefetchedBitmaps = new Set<string>();

/** Download the bitmap into expo-image cache so display is instant. */
export async function prefetchBackdropImage(url: string | null): Promise<void> {
  if (!url || prefetchedBitmaps.has(url)) return;
  try {
    await Image.prefetch(url);
    prefetchedBitmaps.add(url);
  } catch {
    // Display will retry from network
  }
}

/**
 * Resolve backdrop URL + warm image cache before showing the reader.
 */
export async function prepareCurioExperience(curio: Curio): Promise<string | null> {
  const url = await getCurioBackdropUrl(curio);
  await prefetchBackdropImage(url);
  return url;
}

export function isCurioExperiencePrepared(curioId: string): boolean {
  const url = peekCurioBackdropUrl(curioId);
  if (url === undefined) return false;
  if (url === null) return true;
  return prefetchedBitmaps.has(url);
}
