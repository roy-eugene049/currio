import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useURL } from 'expo-linking';

import { createSessionFromUrl } from '@/services/authService';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { getPostAuthRoute } from '@/utils/navigation';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = useURL();
  const { colors } = useTheme();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);

  useEffect(() => {
    if (!url) return;

    createSessionFromUrl(url)
      .then(() => {
        router.replace(
          getPostAuthRoute({ hasCompletedOnboarding, hasSeenWelcome }),
        );
      })
      .catch(() => {
        router.replace('/(auth)/login' as Href);
      });
  }, [hasCompletedOnboarding, hasSeenWelcome, router, url]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
