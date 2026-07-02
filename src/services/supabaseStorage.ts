import { Platform } from 'react-native';

import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/storage';

const STORAGE_PREFIX = 'supabase.auth.';

/**
 * Supabase auth storage adapter that works on native (SecureStore) and web (localStorage).
 */
export const supabaseStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return getSecureItem(`${STORAGE_PREFIX}${key}`);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await setSecureItem(`${STORAGE_PREFIX}${key}`, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await deleteSecureItem(`${STORAGE_PREFIX}${key}`);
  },
};

export function getRedirectUrl(path = 'auth/callback'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${path}`;
  }
  return 'currio://auth/callback';
}
