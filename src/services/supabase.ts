import '@/utils/cryptoPolyfill';
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { ENV } from '@/constants/env';
import { getRedirectUrl, supabaseStorage } from '@/services/supabaseStorage';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!ENV.isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        storage: supabaseStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }

  return supabaseClient;
}

export function getPasswordResetRedirectUrl(): string {
  return getRedirectUrl('auth/reset-password');
}
