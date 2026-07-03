export const CATEGORIES = [
  "Technology",
  "Space",
  "AI",
  "History",
  "Psychology",
  "Philosophy",
  "Science",
  "Nature",
  "Business",
  "Finance",
  "Design",
  "Mathematics",
  "Art",
  "Music",
  "Medicine",
  "Wildlife",
  "Geography",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function pickRandomCategory(categories: string[]): Category {
  const pool = categories.filter(isCategory);
  const source = pool.length > 0 ? pool : [...CATEGORIES];
  return source[Math.floor(Math.random() * source.length)]!;
}
