import { Redirect, type Href } from 'expo-router';
import { useState } from 'react';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { ENV } from '@/constants/env';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function Index() {
  const [splashComplete, setSplashComplete] = useState(false);

  const isAppHydrated = useAppStore((s) => s.isHydrated);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);
  const isAuthHydrated = useAuthStore((s) => s.isAuthHydrated);
  const session = useAuthStore((s) => s.session);

  const ready = isAppHydrated && isAuthHydrated;

  if (!splashComplete) {
    return (
      <AnimatedSplash
        ready={ready}
        onComplete={() => setSplashComplete(true)}
      />
    );
  }

  const isAuthenticated = ENV.isSupabaseConfigured ? Boolean(session) : false;

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  if (!hasSeenWelcome) {
    return <Redirect href={'/welcome' as Href} />;
  }

  return <Redirect href={'/(tabs)' as Href} />;
}
