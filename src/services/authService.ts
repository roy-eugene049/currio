import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { ENV } from '@/constants/env';
import { getPasswordResetRedirectUrl, getSupabase } from '@/services/supabase';
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
} from '@/types/auth';

export function getOAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: 'currio',
    path: 'auth/callback',
  });
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (normalized.includes('password')) {
    return 'Password must be at least 6 characters.';
  }
  if (normalized.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('cancel')) {
    return 'Sign in cancelled';
  }

  return message;
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(mapAuthError(errorCode));
  }

  const { access_token, refresh_token } = params;

  if (!access_token) {
    return null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw new Error(mapAuthError(error.message));
  return data;
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

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
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
