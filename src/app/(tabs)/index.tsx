import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurioReader } from '@/components/home/CurioReader';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getTabBarInset } from '@/components/navigation/FloatingTabBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useTodaysCurio } from '@/hooks/useTodaysCurio';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: curio, isLoading, isError, loadNext, isLoadingNext } =
    useTodaysCurio();

  const bottomInset = getTabBarInset(insets.bottom);

  return (
    <View style={styles.root}>
      {isLoading && (
        <ScreenBackground>
          <SafeAreaView style={styles.safe}>
            <LoadingSkeleton />
          </SafeAreaView>
        </ScreenBackground>
      )}

      {isError && (
        <ScreenBackground>
          <SafeAreaView style={styles.safe}>
            <EmptyState
              icon="alert-circle-outline"
              title="Something went wrong"
              message="Please restart the app and try again."
            />
          </SafeAreaView>
        </ScreenBackground>
      )}

      {curio && !isLoading && (
        <CurioReader
          curio={curio}
          bottomInset={bottomInset}
          onNextCurio={loadNext}
          isLoadingNext={isLoadingNext}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
