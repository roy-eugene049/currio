import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';

import { OAuthNavigationEffect } from '@/components/OAuthNavigationEffect';
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

function HydrationGate({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const isHydrated = useAppStore((s) => s.isHydrated);
  const isAuthHydrated = useAuthStore((s) => s.isAuthHydrated);
  const recordDailyOpen = useAppStore((s) => s.recordDailyOpen);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const { colors } = useTheme();

  useEffect(() => {
    Promise.all([hydrate(), initializeAuth()]).then(() => {
      recordDailyOpen();
    });
  }, [hydrate, initializeAuth, recordDailyOpen]);

  if (!isHydrated || !isAuthHydrated) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />;
  }

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationGate>
        <OAuthNavigationEffect />
        {children}
      </HydrationGate>
    </QueryClientProvider>
  );
}
