import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { CurioReader } from '@/components/home/CurioReader';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useCurioExperience } from '@/hooks/useCurioExperience';
import { resolveCurioById } from '@/services/curioService';

export default function SavedCurrioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const curioId = Array.isArray(id) ? id[0] : id;

  const { data: curio, isLoading, isError } = useQuery({
    queryKey: ['curio', curioId],
    queryFn: async () => {
      if (!curioId) return undefined;
      return resolveCurioById(curioId);
    },
    enabled: Boolean(curioId),
    staleTime: Infinity,
  });

  const { isReady } = useCurioExperience(curio);

  if (!curioId || isError || (!isLoading && !curio)) {
    return (
      <View style={styles.fallback}>
        <EmptyState
          icon="bookmark-outline"
          title="Currio not found"
          message="This saved currio may have been removed."
        />
      </View>
    );
  }

  if (isLoading || !curio || !isReady) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.loading}>
          <LoadingSkeleton />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <View style={styles.root}>
      <CurioReader
        curio={curio}
        bottomInset={Math.max(insets.bottom, 24)}
        onBack={() => router.back()}
        variant="saved"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fallback: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
});
