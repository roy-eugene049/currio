import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { ENV } from '@/constants/env';
import * as authService from '@/services/authService';
import { getSupabase } from '@/services/supabase';
import { useAppStore } from '@/store/useAppStore';
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
} from '@/types/auth';
import { getFriendlyAuthError } from '@/utils/authErrors';
import { cleanOAuthUrlOnWeb } from '@/utils/oauthRedirect';

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
  applySession: (session: Session | null) => Promise<void>;
}

async function bindAppStateToUser(user: User | null | undefined) {
  if (!user?.id) return;
  await useAppStore.getState().reconcileForAuthUser(user.id);
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
      let oauthSession: Session | null = null;

      if (Platform.OS === 'web') {
        try {
          const oauthData = await authService.completeOAuthRedirectIfNeeded();
          if (oauthData?.session) {
            oauthSession = oauthData.session;
            cleanOAuthUrlOnWeb('/auth/callback');
          }
        } catch (oauthError) {
          cleanOAuthUrlOnWeb('/login');
          set({
            error: getFriendlyAuthError(oauthError),
          });
        }
      }

      const session = oauthSession ?? (await authService.getSession());
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
        void bindAppStateToUser(nextSession?.user);
      });
    } catch {
      set({ isAuthHydrated: true, session: null, user: null });
    }
  },

  signIn: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { session, user } = await authService.signIn(params);
      await bindAppStateToUser(user);
      set({ session, user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getFriendlyAuthError(err),
      });
      throw err;
    }
  },

  signUp: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { session, user } = await authService.signUp(params);
      await bindAppStateToUser(user);
      set({ session, user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getFriendlyAuthError(err),
      });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.signInWithGoogle();
      if (data?.session) {
        await bindAppStateToUser(data.user);
        set({
          session: data.session,
          user: data.user,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      const message = getFriendlyAuthError(err);
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
        error: getFriendlyAuthError(err),
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
        error: getFriendlyAuthError(err),
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  applySession: async (session) => {
    set({
      session,
      user: session?.user ?? null,
    });
    await bindAppStateToUser(session?.user);
  },
}));
