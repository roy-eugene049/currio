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

export function pickRandomCategory(
  categories: string[],
  excludeCategory?: string,
): Category {
  let pool = categories.filter(isCategory);
  if (pool.length === 0) {
    pool = [...CATEGORIES];
  }

  if (excludeCategory && pool.length > 1) {
    const otherTopics = pool.filter((category) => category !== excludeCategory);
    if (otherTopics.length > 0) {
      pool = otherTopics;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)]!;
}
