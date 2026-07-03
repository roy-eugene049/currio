import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { getRedirectUrl } from '@/services/supabaseStorage';

/** Redirect URL registered with Supabase for OAuth (web + native / Expo Go). */
export function getOAuthRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return getRedirectUrl('auth/callback');
  }

  const linked = Linking.createURL('auth/callback');
  if (linked) return linked;

  return makeRedirectUri({
    scheme: 'currio',
    path: 'auth/callback',
  });
}

export function hasOAuthRedirectParams(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));

    return (
      parsed.searchParams.has('code') ||
      parsed.searchParams.has('access_token') ||
      parsed.searchParams.has('error') ||
      hashParams.has('access_token') ||
      hashParams.has('error')
    );
  } catch {
    return (
      url.includes('access_token=') ||
      url.includes('code=') ||
      url.includes('error=')
    );
  }
}

export function cleanOAuthUrlOnWeb(path = '/auth/callback'): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, path);
  }
}
