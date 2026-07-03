import { pickRandomCurio } from '@/services/curioService';
import { prepareCurioExperience } from '@/services/curioImageService';
import { useAppStore } from '@/store/useAppStore';
import type { Curio } from '@/types/curio';

type PrefetchedSlot = {
  forCurioId: string;
  nextCurio: Curio;
};

let slot: PrefetchedSlot | null = null;
let inflightPrefetch: { forCurioId: string; task: Promise<Curio | null> } | null = null;

export function takePrefetchedNext(forCurioId: string): Curio | null {
  if (slot?.forCurioId !== forCurioId) return null;
  const next = slot.nextCurio;
  slot = null;
  return next;
}

export function clearPrefetchedNext(): void {
  slot = null;
  inflightPrefetch = null;
}

/**
 * Picks the next curio (without mutating store) and preloads its backdrop.
 * Call while the user reads the current curio so "Another currio" feels instant.
 */
export async function prefetchNextCurio(forCurioId: string): Promise<Curio | null> {
  if (slot?.forCurioId === forCurioId) return slot.nextCurio;

  if (inflightPrefetch?.forCurioId === forCurioId) {
    return inflightPrefetch.task;
  }

  const task = (async () => {
    const state = useAppStore.getState();
    const { curio } = pickRandomCurio(
      state.interests,
      state.seenCurioIds,
      forCurioId,
    );

    await prepareCurioExperience(curio);
    slot = { forCurioId, nextCurio: curio };
    return curio;
  })().catch(() => null);

  inflightPrefetch = { forCurioId, task };
  const result = await task;
  if (inflightPrefetch?.forCurioId === forCurioId) {
    inflightPrefetch = null;
  }
  return result;
}

export function peekPrefetchedNext(forCurioId: string): Curio | null {
  if (slot?.forCurioId !== forCurioId) return null;
  return slot.nextCurio;
}
