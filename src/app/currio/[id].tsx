import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { CurioReader } from '@/components/home/CurioReader';
import { getCurioById } from '@/services/curioService';

export default function SavedCurrioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const curioId = Array.isArray(id) ? id[0] : id;
  const curio = curioId ? getCurioById(curioId) : undefined;

  if (!curio) {
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
