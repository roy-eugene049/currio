import { useFocusEffect } from 'expo-router/react-navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getIntervalCurios,
  recordSessionCurio,
  shouldOfferChallengeOnNext,
} from '@/services/challengeService';
import {
  fetchDailyCurio,
  fetchNextCurio,
  isRemoteCuriosEnabled,
} from '@/services/curioApiService';
import { prepareCurioExperience } from '@/services/curioImageService';
import {
  peekPrefetchedNext,
  prefetchNextCurio,
  subscribePrefetch,
  takePrefetchedNext,
} from '@/services/curioPrefetchService';
import { getCurioById, pickRandomCurio } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useChallengeSheetStore } from '@/store/useChallengeSheetStore';
import type { Category, Curio } from '@/types/curio';
import { buildChallengeQuizFromSession } from '@/utils/challengeQuiz';

type ResolvedNext = {
  curio: Curio;
  resetSeen: boolean;
};

async function loadLocalDailyCurio(
  getTodaysCurio: () => Promise<string>,
): Promise<Curio> {
  const id = await getTodaysCurio();
  const curio = getCurioById(id);
  if (!curio) throw new Error('Curio not found');
  void prepareCurioExperience(curio);
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
  const queryKey = useMemo(
    () => ['todays-curio', remoteEnabled ? 'remote' : 'local'] as const,
    [remoteEnabled],
  );

  const advancingRef = useRef(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [displayEpoch, setDisplayEpoch] = useState(0);
  const [, setPrefetchTick] = useState(0);

  const bumpPrefetch = useCallback(() => {
    setPrefetchTick((tick) => tick + 1);
  }, []);

  useEffect(() => subscribePrefetch(bumpPrefetch), [bumpPrefetch]);

  const warmPrefetch = useCallback(
    (curio: Curio) => {
      void prefetchNextCurio(curio.id, curio.category);
    },
    [],
  );

  const offerChallengeAfterReading = useCallback(async (sessionSnapshot: Curio[]) => {
    const offer = await shouldOfferChallengeOnNext();
    if (!offer) return;

    const quiz = buildChallengeQuizFromSession(sessionSnapshot);
    if (!quiz) return;

    // User already finished the prior curios (they tapped next).
    setTimeout(() => {
      useChallengeSheetStore.getState().openChallenge(quiz);
    }, 900);
  }, []);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (remoteEnabled) {
        try {
          const curio = await fetchDailyCurio();
          await recordRemoteCurio(curio.id, { isDaily: true });
          void prepareCurioExperience(curio);
          warmPrefetch(curio);
          return curio;
        } catch (error) {
          if (__DEV__) {
            console.warn('[Currio] Remote daily curio failed, using local:', error);
          }
        }
      }

      const curio = await loadLocalDailyCurio(getTodaysCurio);
      warmPrefetch(curio);
      return curio;
    },
    enabled: isHydrated && (!remoteEnabled || Boolean(session)),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!query.data) return;
    warmPrefetch(query.data);
    void import('@/services/widgetService').then(({ syncDailyCurioWidget }) =>
      syncDailyCurioWidget({
        id: query.data!.id,
        title: query.data!.title,
        category: query.data!.category,
      }),
    );
  }, [query.data, warmPrefetch]);

  const countedDailyIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    if (countedDailyIdRef.current === query.data.id) return;
    countedDailyIdRef.current = query.data.id;
    // Track only — never open the sheet here so they can finish reading.
    recordSessionCurio(query.data);
  }, [query.data]);

  useFocusEffect(
    useCallback(() => {
      const curio = queryClient.getQueryData<Curio>(queryKey);
      if (!curio) return;

      const timer = setTimeout(() => {
        warmPrefetch(curio);
      }, 280);

      return () => clearTimeout(timer);
    }, [queryClient, queryKey, warmPrefetch]),
  );

  const isNextReady = query.data
    ? Boolean(peekPrefetchedNext(query.data.id))
    : false;

  const fetchSlowNext = useCallback(
    async (
      currentCurioId: string,
      currentCategory?: Category,
    ): Promise<ResolvedNext> => {
      if (remoteEnabled) {
        const storeInterests = useAppStore.getState().interests;
        const excludeCategory =
          storeInterests.length > 1 ? currentCategory : undefined;

        try {
          const curio = await fetchNextCurio(currentCurioId, excludeCategory);
          void prepareCurioExperience(curio);
          return { curio, resetSeen: false };
        } catch (error) {
          if (__DEV__) {
            console.warn('[Currio] Remote next curio failed, using local:', error);
          }
        }
      }

      const state = useAppStore.getState();
      const excludeCategory =
        state.interests.length > 1 ? currentCategory : undefined;
      const { curio, resetSeen } = pickRandomCurio(
        state.interests,
        state.seenCurioIds,
        currentCurioId,
        excludeCategory,
      );
      void prepareCurioExperience(curio);
      return { curio, resetSeen };
    },
    [remoteEnabled],
  );

  const persistCurioAdvance = useCallback(
    async (resolved: ResolvedNext, previousCurioId: string) => {
      if (remoteEnabled) {
        await recordRemoteCurio(resolved.curio.id);
        return;
      }

      await pickNextCurio(
        previousCurioId,
        resolved.curio.id,
        resolved.curio.category,
        resolved.resetSeen,
      );
    },
    [pickNextCurio, recordRemoteCurio, remoteEnabled],
  );

  const loadNext = useCallback(async (): Promise<Curio> => {
    if (advancingRef.current) {
      const cached = queryClient.getQueryData<Curio>(queryKey);
      if (cached) return cached;
      throw new Error('Curio advance already in progress');
    }

    const current = queryClient.getQueryData<Curio>(queryKey);
    if (!current) throw new Error('No current curio');

    // Snapshot the interval window before advancing — only curios already read.
    const sessionSnapshot = getIntervalCurios();

    advancingRef.current = true;
    setIsAdvancing(true);

    try {
      let resolved: ResolvedNext | null = null;

      let next = takePrefetchedNext(current.id);
      if (!next) {
        await prefetchNextCurio(current.id, current.category);
        next = takePrefetchedNext(current.id);
      }

      if (next && next.id !== current.id) {
        resolved = { curio: next, resetSeen: false };
      }

      if (!resolved) {
        resolved = await fetchSlowNext(current.id, current.category);
      }

      if (resolved.curio.id === current.id) {
        throw new Error('Could not load another curio');
      }

      queryClient.setQueryData<Curio>(queryKey, resolved.curio);
      setDisplayEpoch((epoch) => epoch + 1);

      warmPrefetch(resolved.curio);
      void persistCurioAdvance(resolved, current.id);

      // After ≥3 read curios, offer on shuffle — never on first open of the 3rd.
      void offerChallengeAfterReading(sessionSnapshot);

      return resolved.curio;
    } finally {
      advancingRef.current = false;
      setIsAdvancing(false);
    }
  }, [
    fetchSlowNext,
    offerChallengeAfterReading,
    persistCurioAdvance,
    queryClient,
    queryKey,
    warmPrefetch,
  ]);

  return {
    ...query,
    loadNext,
    isLoadingNext: isAdvancing,
    isNextReady,
    displayEpoch,
  };
}
