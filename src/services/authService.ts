import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { ENV } from '@/constants/env';
import { getPasswordResetRedirectUrl, getSupabase } from '@/services/supabase';
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
} from '@/types/auth';
import { mapAuthErrorMessage } from '@/utils/authErrors';
import {
  getOAuthRedirectUrl,
  hasOAuthRedirectParams,
} from '@/utils/oauthRedirect';

function mapAuthError(message: string): string {
  return mapAuthErrorMessage(message);
}

function getAuthParamsFromUrl(url: string) {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));

  return {
    code: parsed.searchParams.get('code'),
    accessToken:
      hashParams.get('access_token') ?? parsed.searchParams.get('access_token'),
    refreshToken:
      hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token'),
    error:
      hashParams.get('error') ??
      parsed.searchParams.get('error') ??
      hashParams.get('error_code') ??
      parsed.searchParams.get('error_code'),
    errorDescription:
      hashParams.get('error_description') ??
      parsed.searchParams.get('error_description'),
  };
}

export async function createSessionFromUrl(url: string) {
  if (!hasOAuthRedirectParams(url)) {
    return null;
  }

  const { code, accessToken, refreshToken, error, errorDescription } =
    getAuthParamsFromUrl(url);

  if (error) {
    throw new Error(mapAuthError(errorDescription ?? error));
  }

  const supabase = getSupabase();

  if (code) {
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw new Error(mapAuthError(exchangeError.message));
    return data;
  }

  if (accessToken) {
    const { data, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });
    if (sessionError) throw new Error(mapAuthError(sessionError.message));
    return data;
  }

  return null;
}

export async function signUp({ email, password }: SignUpParams) {
  if (!ENV.isSupabaseConfigured) {
    throw new Error('Backend not configured. See docs/BACKEND.md');
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(mapAuthError(error.message));
  return data;
}

export async function signIn({ email, password }: SignInParams) {
  if (!ENV.isSupabaseConfigured) {
    throw new Error('Backend not configured. See docs/BACKEND.md');
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(mapAuthError(error.message));
  return data;
}

export async function signInWithGoogle() {
  if (!ENV.isSupabaseConfigured) {
    throw new Error('Backend not configured. See docs/BACKEND.md');
  }

  const supabase = getSupabase();
  const redirectTo = getOAuthRedirectUrl();

  if (__DEV__) {
    console.info('[Currio] OAuth redirect URL:', redirectTo);
  }

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) throw new Error(mapAuthError(error.message));
    return null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(mapAuthError(error.message));
  if (!data.url) throw new Error('Could not start Google sign in');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    return createSessionFromUrl(result.url);
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign in cancelled');
  }

  throw new Error('Google sign in failed');
}

export async function signOut() {
  if (!ENV.isSupabaseConfigured) return;
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(mapAuthError(error.message));
}

export async function resetPassword({ email }: ResetPasswordParams) {
  if (!ENV.isSupabaseConfigured) {
    throw new Error('Backend not configured. See docs/BACKEND.md');
  }

  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: getPasswordResetRedirectUrl() },
  );

  if (error) throw new Error(mapAuthError(error.message));
}

export async function getSession() {
  if (!ENV.isSupabaseConfigured) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(mapAuthError(error.message));
  return data.session;
}

/** Process OAuth callback URL on web (root or /auth/callback). */
export async function completeOAuthRedirectIfNeeded() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const href = window.location.href;
  if (!hasOAuthRedirectParams(href)) {
    return null;
  }

  return createSessionFromUrl(href);
}
