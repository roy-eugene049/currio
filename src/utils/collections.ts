import * as Crypto from 'expo-crypto';

import type { CurioCollection } from '@/types/curio';

const MAX_NAME_LENGTH = 48;

export function createCollectionId(): string {
  return Crypto.randomUUID();
}

export function normalizeCollectionName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

export function sortCollections(collections: CurioCollection[]): CurioCollection[] {
  return [...collections].sort((a, b) => {
    const byUpdated = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (byUpdated !== 0) return byUpdated;
    return a.name.localeCompare(b.name);
  });
}

export function stripCurioFromCollections(
  collections: CurioCollection[],
  curioId: string,
): CurioCollection[] {
  let changed = false;
  const next = collections.map((collection) => {
    if (!collection.curioIds.includes(curioId)) return collection;
    changed = true;
    return {
      ...collection,
      curioIds: collection.curioIds.filter((id) => id !== curioId),
      updatedAt: new Date().toISOString(),
    };
  });
  return changed ? next : collections;
}

export function toggleCurioInCollection(
  collections: CurioCollection[],
  collectionId: string,
  curioId: string,
): CurioCollection[] {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    const has = collection.curioIds.includes(curioId);
    return {
      ...collection,
      curioIds: has
        ? collection.curioIds.filter((id) => id !== curioId)
        : [...collection.curioIds, curioId],
      updatedAt: new Date().toISOString(),
    };
  });
}

export function pruneCollectionsToBookmarks(
  collections: CurioCollection[],
  bookmarks: string[],
): CurioCollection[] {
  const bookmarkSet = new Set(bookmarks);
  let changed = false;
  const next = collections.map((collection) => {
    const curioIds = collection.curioIds.filter((id) => bookmarkSet.has(id));
    if (curioIds.length === collection.curioIds.length) return collection;
    changed = true;
    return {
      ...collection,
      curioIds,
      updatedAt: new Date().toISOString(),
    };
  });
  return changed ? next : collections;
}
