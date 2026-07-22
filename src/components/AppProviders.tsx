import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';

import { OAuthNavigationEffect } from '@/components/OAuthNavigationEffect';
import { AuthSessionGuard } from '@/components/AuthSessionGuard';
import { SaveToCollectionSheet } from '@/components/bookmarks/SaveToCollectionSheet';
import { ChallengeSheet } from '@/components/challenge/ChallengeSheet';
import { ToastHost } from '@/components/ui/ToastHost';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ReminderRescheduleOnForeground() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const wasBackground =
        appState.current === 'background' || appState.current === 'inactive';
      appState.current = next;
      if (!wasBackground || next !== 'active') return;
      if (!useAppStore.getState().learningRemindersEnabled) return;
      void useAppStore.getState().rescheduleReminders();
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  return null;
}

function HydrationGate({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const isHydrated = useAppStore((s) => s.isHydrated);
  const reconcileForAuthUser = useAppStore((s) => s.reconcileForAuthUser);
  const isAuthHydrated = useAuthStore((s) => s.isAuthHydrated);
  const recordDailyOpen = useAppStore((s) => s.recordDailyOpen);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const { colors } = useTheme();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([hydrate(), initializeAuth()])
      .then(async () => {
        const id = useAuthStore.getState().user?.id;
        if (id) {
          await reconcileForAuthUser(id);
          const { pullAndMerge } = await import('@/services/syncService');
          await pullAndMerge();
        }
        await recordDailyOpen();

        if (useAppStore.getState().learningRemindersEnabled) {
          await useAppStore.getState().rescheduleReminders();
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrate, initializeAuth, reconcileForAuthUser, recordDailyOpen]);

  if (!isHydrated || !isAuthHydrated || !bootstrapped) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />;
  }

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationGate>
        <ReminderRescheduleOnForeground />
        <OAuthNavigationEffect />
        <AuthSessionGuard />
        {children}
        <SaveToCollectionSheet />
        <ChallengeSheet />
        <ToastHost />
      </HydrationGate>
    </QueryClientProvider>
  );
}
