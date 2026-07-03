import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useURL } from 'expo-linking';

import { createSessionFromUrl, getSession } from '@/services/authService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { cleanOAuthUrlOnWeb, hasOAuthRedirectParams } from '@/utils/oauthRedirect';
import { getPostAuthRoute } from '@/utils/navigation';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = useURL();
  const { colors } = useTheme();
  const applySession = useAuthStore((s) => s.applySession);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const finish = (href: Href) => {
      handled.current = true;
      cleanOAuthUrlOnWeb('/auth/callback');
      router.replace(href);
    };

    const processCallback = async () => {
      const callbackUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.href
          : url;

      try {
        if (callbackUrl && hasOAuthRedirectParams(callbackUrl)) {
          const data = await createSessionFromUrl(callbackUrl);
          if (data?.session) {
            applySession(data.session);
          }
        }

        const session = (await getSession()) ?? useAuthStore.getState().session;
        if (!session) {
          finish('/(auth)/login' as Href);
          return;
        }

        applySession(session);
        finish(getPostAuthRoute({ hasCompletedOnboarding, hasSeenWelcome }));
      } catch {
        finish('/(auth)/login' as Href);
      }
    };

    void processCallback();
  }, [
    applySession,
    hasCompletedOnboarding,
    hasSeenWelcome,
    router,
    url,
  ]);

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
