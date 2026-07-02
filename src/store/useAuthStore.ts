import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { ENV } from '@/constants/env';
import * as authService from '@/services/authService';
import { getSupabase } from '@/services/supabase';
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
} from '@/types/auth';

interface AuthStore {
  session: Session | null;
  user: User | null;
  isAuthHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isAuthHydrated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (!ENV.isSupabaseConfigured) {
      set({ isAuthHydrated: true, session: null, user: null });
      return;
    }

    try {
      const session = await authService.getSession();
      set({
        session,
        user: session?.user ?? null,
        isAuthHydrated: true,
      });

      const supabase = getSupabase();
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({
          session: nextSession,
          user: nextSession?.user ?? null,
        });
      });
    } catch {
      set({ isAuthHydrated: true, session: null, user: null });
    }
  },

  signIn: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { session, user } = await authService.signIn(params);
      set({ session, user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Sign in failed',
      });
      throw err;
    }
  },

  signUp: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { session, user } = await authService.signUp(params);
      set({ session, user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Sign up failed',
      });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.signInWithGoogle();
      if (data?.session) {
        set({
          session: data.session,
          user: data.user,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign in failed';
      if (message !== 'Sign in cancelled') {
        set({ isLoading: false, error: message });
      } else {
        set({ isLoading: false });
      }
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ session: null, user: null, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Sign out failed',
      });
      throw err;
    }
  },

  resetPassword: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(params);
      set({ isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Password reset failed',
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
