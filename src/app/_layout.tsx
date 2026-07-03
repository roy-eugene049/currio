import '../../global.css';

import '@/utils/cryptoPolyfill';

import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AppProviders } from '@/components/AppProviders';
import { useAppStore } from '@/store/useAppStore';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bookmarks" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="currio/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </AppProviders>
  );
}
