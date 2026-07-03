import { buildCurioImageQuery, pexelsPageForCurio } from "./imageQuery.ts";

type CurioLike = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export async function fetchPexelsImage(
  query: string,
  page: number,
): Promise<string | null> {
  const apiKey = Deno.env.get("PEXELS_API_KEY");
  if (!apiKey) return null;

  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=portrait`;

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    photos?: Array<{
      src?: { large2x?: string; large?: string; portrait?: string };
    }>;
  };

  const photo = data.photos?.[0]?.src;
  return photo?.large2x ?? photo?.portrait ?? photo?.large ?? null;
}

export async function resolveCurioImageUrl(curio: CurioLike): Promise<string | null> {
  const query = buildCurioImageQuery(curio);
  if (!query) return null;
  return fetchPexelsImage(query, pexelsPageForCurio(curio.id));
}
