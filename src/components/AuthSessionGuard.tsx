import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuthStore } from '@/store/useAuthStore';

const SESSION_CHECK_MS = 15_000;

function isAuthRoute(segment: string | undefined) {
  return segment === '(auth)' || segment === 'auth' || segment === 'index';
}

export function AuthSessionGuard() {
  const router = useRouter();
  const segments = useSegments();
  const session = useAuthStore((s) => s.session);
  const isAuthHydrated = useAuthStore((s) => s.isAuthHydrated);
  const validateSession = useAuthStore((s) => s.validateSession);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isAuthHydrated || session || isAuthRoute(segments[0])) return;
    router.replace('/(auth)/login' as Href);
  }, [isAuthHydrated, router, segments, session]);

  useEffect(() => {
    if (!isAuthHydrated || !session) return;

    const runCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      try {
        const isValid = await validateSession();
        if (!isValid) {
          router.replace('/(auth)/login' as Href);
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    void runCheck();
    const interval = setInterval(runCheck, SESSION_CHECK_MS);
    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') void runCheck();
      },
    );
    const focusSub = AppState.addEventListener('focus', () => {
      void runCheck();
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      focusSub.remove();
    };
  }, [isAuthHydrated, router, session, validateSession]);

  return null;
}
