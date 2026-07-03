import { fetchNextCurio, isRemoteCuriosEnabled } from '@/services/curioApiService';
import { prepareCurioExperience } from '@/services/curioImageService';
import { pickRandomCurio } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Curio } from '@/types/curio';

type PrefetchedSlot = {
  forCurioId: string;
  nextCurio: Curio;
};

let slot: PrefetchedSlot | null = null;
let inflightPrefetch: { forCurioId: string; task: Promise<Curio | null> } | null = null;
const listeners = new Set<() => void>();

function notifyPrefetchListeners(): void {
  listeners.forEach((listener) => listener());
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

export function clearPrefetchedNext(): void {
  slot = null;
  inflightPrefetch = null;
  notifyPrefetchListeners();
}

export function peekPrefetchedNext(forCurioId: string): Curio | null {
  if (slot?.forCurioId !== forCurioId) return null;
  return slot.nextCurio;
}

async function resolveLocalPrefetch(forCurioId: string): Promise<Curio> {
  const state = useAppStore.getState();
  const { curio } = pickRandomCurio(
    state.interests,
    state.seenCurioIds,
    forCurioId,
  );
  await prepareCurioExperience(curio);
  return curio;
}

async function resolveRemotePrefetch(forCurioId: string): Promise<Curio> {
  try {
    const curio = await fetchNextCurio(forCurioId);
    await prepareCurioExperience(curio);
    return curio;
  } catch {
    return resolveLocalPrefetch(forCurioId);
  }
}

/**
 * Picks the next curio and preloads its backdrop while the user reads the current one.
 */
export async function prefetchNextCurio(forCurioId: string): Promise<Curio | null> {
  if (slot?.forCurioId === forCurioId) return slot.nextCurio;

  if (inflightPrefetch?.forCurioId === forCurioId) {
    return inflightPrefetch.task;
  }

  const task = (async () => {
    const remoteEnabled =
      isRemoteCuriosEnabled() && Boolean(useAuthStore.getState().session);

    const curio = remoteEnabled
      ? await resolveRemotePrefetch(forCurioId)
      : await resolveLocalPrefetch(forCurioId);

    slot = { forCurioId, nextCurio: curio };
    notifyPrefetchListeners();
    return curio;
  })().catch(() => null);

  inflightPrefetch = { forCurioId, task };
  const result = await task;
  if (inflightPrefetch?.forCurioId === forCurioId) {
    inflightPrefetch = null;
  }
  if (result) {
    notifyPrefetchListeners();
  }
  return result;
}

/** Wait for an in-flight prefetch or start one. */
export async function ensurePrefetchedNext(forCurioId: string): Promise<Curio | null> {
  const ready = peekPrefetchedNext(forCurioId);
  if (ready) return ready;
  return prefetchNextCurio(forCurioId);
}
