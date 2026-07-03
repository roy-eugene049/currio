const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "boy",
  "did",
  "let",
  "put",
  "say",
  "she",
  "too",
  "use",
  "from",
  "with",
  "that",
  "this",
  "what",
  "when",
  "where",
  "which",
  "your",
  "they",
  "them",
  "their",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "along",
  "across",
  "behind",
  "beyond",
  "under",
  "above",
  "below",
  "near",
  "far",
  "first",
  "last",
  "next",
  "many",
  "most",
  "more",
  "some",
  "such",
  "only",
  "very",
  "just",
  "also",
  "than",
  "then",
  "once",
  "here",
  "there",
  "why",
  "how",
  "each",
  "few",
  "other",
  "no",
  "nor",
  "not",
  "same",
  "so",
  "too",
  "it",
  "we",
  "our",
  "as",
  "by",
  "he",
]);

type CurioLike = {
  title: string;
  content: string;
  category: string;
};

/** Search terms derived from the curio itself — not the category stock pool. */
export function buildCurioImageQuery(curio: CurioLike): string {
  const words = curio.title
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word.toLowerCase()));

  const titleTerms = words.slice(0, 6).join(" ");
  const contentHint = curio.content
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 2)
    .join(" ");

  return [titleTerms, contentHint, curio.category].filter(Boolean).join(" ").trim();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pexelsPageForCurio(id: string): number {
  return (hashString(id) % 12) + 1;
}
