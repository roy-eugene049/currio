import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthRoute } from '@/utils/navigation';

/** After web OAuth, route away from callback/root once session is in the store. */
function OAuthNavigationEffect() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isAuthHydrated = useAuthStore((s) => s.isAuthHydrated);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isAuthHydrated || !session) return;
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    const onOAuthLanding = path === '/' || path === '/auth/callback';

    if (onOAuthLanding) {
      const appState = useAppStore.getState();
      router.replace(
        getPostAuthRoute({
          hasCompletedOnboarding: appState.hasCompletedOnboarding,
          hasSeenWelcome: appState.hasSeenWelcome,
        }) as Href,
      );
    }
  }, [isAuthHydrated, router, session]);

  return null;
}

export { OAuthNavigationEffect };
