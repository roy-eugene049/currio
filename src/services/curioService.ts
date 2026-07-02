import { CURIOS } from '@/data/curios';
import type { Category, Curio } from '@/types/curio';

export function getCurioById(id: string): Curio | undefined {
  return CURIOS.find((curio) => curio.id === id);
}

export function getCuriosByCategories(categories: Category[]): Curio[] {
  if (categories.length === 0) return CURIOS;
  return CURIOS.filter((curio) => categories.includes(curio.category));
}

/**
 * Picks a random curio from the pool, excluding already-seen IDs.
 * When all curios in the pool have been shown, resets the seen list.
 * Pass excludeId to avoid re-showing the currio the user is currently reading.
 */
export function pickRandomCurio(
  interests: Category[],
  seenIds: string[],
  excludeId?: string,
): { curio: Curio; resetSeen: boolean } {
  const pool = getCuriosByCategories(interests);
  if (pool.length === 0) {
    throw new Error('No currios available for your interests');
  }

  const pickFrom = (candidates: Curio[], resetSeen: boolean) => {
    let options = candidates;
    if (excludeId && options.length > 1) {
      options = options.filter((curio) => curio.id !== excludeId);
    }
    if (options.length === 0) {
      throw new Error('No more currios to show');
    }
    const randomIndex = Math.floor(Math.random() * options.length);
    return { curio: options[randomIndex]!, resetSeen };
  };

  const unseen = pool.filter((curio) => !seenIds.includes(curio.id));
  if (unseen.length > 0) {
    return pickFrom(unseen, false);
  }

  return pickFrom(pool, true);
}

export function getBookmarkedCurios(bookmarkIds: string[]): Curio[] {
  return bookmarkIds
    .map((id) => getCurioById(id))
    .filter((curio): curio is Curio => curio !== undefined);
}
