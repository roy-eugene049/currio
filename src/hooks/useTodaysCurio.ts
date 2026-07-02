import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
      return curio;
    },
    enabled: isHydrated,
    staleTime: Infinity,
  });

  const nextMutation = useMutation({
    mutationFn: async (currentCurioId: string) => {
      const id = await pickNextCurio(currentCurioId);
      const curio = getCurioById(id);
      if (!curio) throw new Error('Curio not found');
      return curio;
    },
    onSuccess: (curio) => {
      queryClient.setQueryData<Curio>(['todays-curio'], curio);
    },
  });

  return {
    ...query,
    loadNext: (currentCurioId: string) => nextMutation.mutateAsync(currentCurioId),
    isLoadingNext: nextMutation.isPending,
  };
}
