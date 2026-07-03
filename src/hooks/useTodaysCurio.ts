import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import {
  fetchDailyCurio,
  fetchNextCurio,
  isRemoteCuriosEnabled,
} from '@/services/curioApiService';
import { prepareCurioExperience } from '@/services/curioImageService';
import {
  ensurePrefetchedNext,
  peekPrefetchedNext,
  prefetchNextCurio,
  subscribePrefetch,
  takePrefetchedNext,
} from '@/services/curioPrefetchService';
import { getCurioById } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Curio } from '@/types/curio';

async function loadLocalDailyCurio(
  getTodaysCurio: () => Promise<string>,
): Promise<Curio> {
  const id = await getTodaysCurio();
  const curio = getCurioById(id);
  if (!curio) throw new Error('Curio not found');
  await prepareCurioExperience(curio);
  return curio;
}

export function useTodaysCurio() {
  const getTodaysCurio = useAppStore((s) => s.getTodaysCurio);
  const pickNextCurio = useAppStore((s) => s.pickNextCurio);
  const recordRemoteCurio = useAppStore((s) => s.recordRemoteCurio);
  const isHydrated = useAppStore((s) => s.isHydrated);
  const session = useAuthStore((s) => s.session);
  const remoteEnabled = isRemoteCuriosEnabled() && Boolean(session);

  const queryClient = useQueryClient();
  const queryKey = ['todays-curio', remoteEnabled ? 'remote' : 'local'] as const;

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [, setPrefetchTick] = useState(0);

  const bumpPrefetch = useCallback(() => {
    setPrefetchTick((tick) => tick + 1);
  }, []);

  useEffect(() => subscribePrefetch(bumpPrefetch), [bumpPrefetch]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (remoteEnabled) {
        try {
          const curio = await fetchDailyCurio();
          await recordRemoteCurio(curio.id, { isDaily: true });
          await prepareCurioExperience(curio);
          return curio;
        } catch (error) {
          if (__DEV__) {
            console.warn('[Currio] Remote daily curio failed, using local:', error);
          }
        }
      }

      return loadLocalDailyCurio(getTodaysCurio);
    },
    enabled: isHydrated && (!remoteEnabled || Boolean(session)),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!query.data) return;
    void prefetchNextCurio(query.data.id);
  }, [query.data?.id]);

  const isNextReady = query.data
    ? Boolean(peekPrefetchedNext(query.data.id))
    : false;

  const fetchSlowNext = useCallback(
    async (currentCurioId: string): Promise<Curio> => {
      if (remoteEnabled) {
        const curio = await fetchNextCurio(currentCurioId);
        await prepareCurioExperience(curio);
        return curio;
      }

      const id = await pickNextCurio(currentCurioId);
      const curio = getCurioById(id);
      if (!curio) throw new Error('Curio not found');
      await prepareCurioExperience(curio);
      return curio;
    },
    [pickNextCurio, remoteEnabled],
  );

  const applyNextCurio = useCallback(
    (next: Curio, currentCurioId: string) => {
      queryClient.setQueryData<Curio>(queryKey, next);

      void (async () => {
        if (remoteEnabled) {
          await recordRemoteCurio(next.id);
        } else {
          await pickNextCurio(currentCurioId, next.id);
        }
        await prefetchNextCurio(next.id);
      })();
    },
    [pickNextCurio, queryClient, queryKey, recordRemoteCurio, remoteEnabled],
  );

  const loadNext = useCallback(
    async (currentCurioId: string) => {
      let next = takePrefetchedNext(currentCurioId);

      if (!next) {
        setIsAdvancing(true);
        try {
          await ensurePrefetchedNext(currentCurioId);
          next = takePrefetchedNext(currentCurioId);
          if (!next) {
            next = await fetchSlowNext(currentCurioId);
          }
        } finally {
          setIsAdvancing(false);
        }
      }

      applyNextCurio(next, currentCurioId);
      return next;
    },
    [applyNextCurio, fetchSlowNext],
  );

  return {
    ...query,
    loadNext,
    isLoadingNext: isAdvancing,
    isNextReady,
  };
}
