import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  fetchDailyCurio,
  fetchNextCurio,
  isRemoteCuriosEnabled,
} from '@/services/curioApiService';
import { prepareCurioExperience } from '@/services/curioImageService';
import {
  prefetchNextCurio,
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

  const query = useQuery({
    queryKey: ['todays-curio', remoteEnabled ? 'remote' : 'local'],
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

  const nextMutation = useMutation({
    mutationFn: async (currentCurioId: string) => {
      if (remoteEnabled) {
        try {
          const prefetched = takePrefetchedNext(currentCurioId);
          if (prefetched) {
            await recordRemoteCurio(prefetched.id);
            return prefetched;
          }

          const curio = await fetchNextCurio(currentCurioId);
          await recordRemoteCurio(curio.id);
          await prepareCurioExperience(curio);
          return curio;
        } catch (error) {
          if (__DEV__) {
            console.warn('[Currio] Remote next curio failed, using local:', error);
          }
        }
      }

      const prefetched = takePrefetchedNext(currentCurioId);
      const id = await pickNextCurio(currentCurioId, prefetched?.id);
      const curio = getCurioById(id);
      if (!curio) throw new Error('Curio not found');

      if (!prefetched || prefetched.id !== id) {
        await prepareCurioExperience(curio);
      }

      return curio;
    },
    onSuccess: (curio) => {
      queryClient.setQueryData<Curio>(['todays-curio', remoteEnabled ? 'remote' : 'local'], curio);
      void prefetchNextCurio(curio.id);
    },
  });

  return {
    ...query,
    loadNext: (currentCurioId: string) => nextMutation.mutateAsync(currentCurioId),
    isLoadingNext: nextMutation.isPending,
  };
}
