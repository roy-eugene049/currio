import { fetchNextCurio, isRemoteCuriosEnabled } from '@/services/curioApiService';
import { prepareCurioExperience } from '@/services/curioImageService';
import { pickRandomCurio } from '@/services/curioService';
import type { Category, Curio } from '@/types/curio';

type PrefetchedSlot = {
  forCurioId: string;
  nextCurio: Curio;
};

let slot: PrefetchedSlot | null = null;
let inflightKey: string | null = null;
let inflightTask: Promise<Curio | null> | null = null;
const listeners = new Set<() => void>();

function notifyPrefetchListeners(): void {
  listeners.forEach((listener) => listener());
}

function prefetchKey(forCurioId: string, currentCategory?: Category): string {
  return `${forCurioId}:${currentCategory ?? ''}`;
}

export function subscribePrefetch(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function takePrefetchedNext(forCurioId: string): Curio | null {
  if (slot?.forCurioId !== forCurioId) return null;
  const next = slot.nextCurio;
  slot = null;
  notifyPrefetchListeners();
  return next;
}

/** Drop cached next curio — use on interest changes or auth resets only. */
export function clearPrefetchedNext(): void {
  slot = null;
  inflightKey = null;
  inflightTask = null;
  notifyPrefetchListeners();
}

export function peekPrefetchedNext(forCurioId: string): Curio | null {
  if (slot?.forCurioId !== forCurioId) return null;
  return slot.nextCurio;
}

async function resolveLocalNext(
  forCurioId: string,
  currentCategory?: Category,
): Promise<Curio> {
  const { useAppStore } = await import('@/store/useAppStore');
  const state = useAppStore.getState();
  const excludeCategory =
    state.interests.length > 1 ? currentCategory : undefined;
  const { curio } = pickRandomCurio(
    state.interests,
    state.seenCurioIds,
    forCurioId,
    excludeCategory,
  );
  return curio;
}

async function resolveRemoteNext(
  forCurioId: string,
  currentCategory?: Category,
): Promise<Curio> {
  const { useAppStore } = await import('@/store/useAppStore');
  const interests = useAppStore.getState().interests;
  const excludeCategory = interests.length > 1 ? currentCategory : undefined;

  try {
    return await fetchNextCurio(forCurioId, excludeCategory);
  } catch {
    return resolveLocalNext(forCurioId, currentCategory);
  }
}

async function resolveNextCurio(
  forCurioId: string,
  currentCategory?: Category,
): Promise<Curio> {
  const { useAuthStore } = await import('@/store/useAuthStore');
  const remoteEnabled =
    isRemoteCuriosEnabled() && Boolean(useAuthStore.getState().session);

  return remoteEnabled
    ? resolveRemoteNext(forCurioId, currentCategory)
    : resolveLocalNext(forCurioId, currentCategory);
}

function warmCurioExperience(curio: Curio): void {
  void prepareCurioExperience(curio).then(() => notifyPrefetchListeners());
}

/**
 * Picks the next curio and preloads its backdrop while the user reads the current one.
 * Text is available immediately; backdrop warming runs in the background.
 */
export async function prefetchNextCurio(
  forCurioId: string,
  currentCategory?: Category,
): Promise<Curio | null> {
  const ready = peekPrefetchedNext(forCurioId);
  if (ready) return ready;

  const key = prefetchKey(forCurioId, currentCategory);
  if (inflightKey === key && inflightTask) {
    return inflightTask;
  }

  inflightKey = key;
  inflightTask = (async () => {
    try {
      const curio = await resolveNextCurio(forCurioId, currentCategory);
      if (inflightKey !== key) return null;

      slot = { forCurioId, nextCurio: curio };
      notifyPrefetchListeners();
      warmCurioExperience(curio);
      return curio;
    } catch {
      return null;
    } finally {
      if (inflightKey === key) {
        inflightKey = null;
        inflightTask = null;
      }
    }
  })();

  return inflightTask;
}
