export const PROMPT_VERSION = "v1";
export const OPENAI_MODEL = "gpt-4o-mini";
export const MAX_GENERATIONS_PER_DAY = 10;

export type CurioRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  reading_time: string;
  image_url: string | null;
};

export type ApiCurio = {
  id: string;
  title: string;
  content: string;
  category: string;
  readingTime: string;
  image: string | null;
};

export function mapRow(row: CurioRow): ApiCurio {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    readingTime: row.reading_time,
    image: row.image_url ?? null,
  };
}

export async function contentHash(title: string, content: string): Promise<string> {
  const normalized = `${title.trim().toLowerCase()}\n${content.trim().toLowerCase()}`;
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function isAiGenerationEnabled(): boolean {
  if (Deno.env.get("AI_CURIOS_ENABLED") === "false") return false;
  return Boolean(Deno.env.get("OPENAI_API_KEY"));
}
