import type { Href } from 'expo-router';

export function getPostAuthRoute(state: {
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
}): Href {
  if (!state.hasCompletedOnboarding) {
    return '/onboarding' as Href;
  }
  if (!state.hasSeenWelcome) {
    return '/welcome' as Href;
  }
  return '/(tabs)' as Href;
}
