import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { prepareCurioExperience } from '@/services/curioImageService';
import {
  prefetchNextCurio,
  takePrefetchedNext,
} from '@/services/curioPrefetchService';
import { getCurioById } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import type { Curio } from '@/types/curio';

export function useTodaysCurio() {
  const getTodaysCurio = useAppStore((s) => s.getTodaysCurio);
  const pickNextCurio = useAppStore((s) => s.pickNextCurio);
  const isHydrated = useAppStore((s) => s.isHydrated);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['todays-curio'],
    queryFn: async () => {
      const id = await getTodaysCurio();
      const curio = getCurioById(id);
      if (!curio) throw new Error('Curio not found');
      await prepareCurioExperience(curio);
      return curio;
    },
    enabled: isHydrated,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!query.data) return;
    void prefetchNextCurio(query.data.id);
  }, [query.data?.id]);

  const nextMutation = useMutation({
    mutationFn: async (currentCurioId: string) => {
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
      queryClient.setQueryData<Curio>(['todays-curio'], curio);
      void prefetchNextCurio(curio.id);
    },
  });

  return {
    ...query,
    loadNext: (currentCurioId: string) => nextMutation.mutateAsync(currentCurioId),
    isLoadingNext: nextMutation.isPending,
  };
}
