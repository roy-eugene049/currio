import { Link, useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput } from 'react-native';

import {
  AuthConfigBanner,
  AuthSuccessBanner,
} from '@/components/auth/AuthBanner';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthProgressOverlay } from '@/components/auth/AuthProgressOverlay';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { ENV } from '@/constants/env';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { showAuthErrorToast, showToast } from '@/utils/authFeedback';
import { getPostAuthRoute } from '@/utils/navigation';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const isBusy = isLoading || Boolean(authMessage);

  const navigateAfterAuth = () => {
    const appState = useAppStore.getState();
    router.replace(
      getPostAuthRoute({
        hasCompletedOnboarding: appState.hasCompletedOnboarding,
        hasSeenWelcome: appState.hasSeenWelcome,
      }),
    );
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setSuccessMessage(null);
    clearError();

    if (!email.trim() || !password) {
      showToast('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.');
      return;
    }

    try {
      setAuthMessage('Creating your account');
      await signUp({ email, password });
      const session = useAuthStore.getState().session;
      if (session) {
        setAuthMessage('Opening Currio');
        setTimeout(navigateAfterAuth, 350);
        return;
      }
      setAuthMessage(null);
      setSuccessMessage(
        'Check your email to confirm your account. Then come back and sign in.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch {
      setAuthMessage(null);
      showAuthErrorToast();
    }
  };

  const passwordHint =
    password.length > 0 && password.length < 6
      ? `${6 - password.length} more character${6 - password.length === 1 ? '' : 's'} needed`
      : null;

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Join Currio and start discovering something new every day."
      overlay={
        authMessage ? (
          <AuthProgressOverlay
            title={authMessage}
            message="Preparing your Currio space."
          />
        ) : null
      }
      footer={
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href={'/(auth)/login' as Href} asChild>
            <Pressable>
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}
              >
                Sign in
              </Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      {!ENV.isSupabaseConfigured && (
        <AuthConfigBanner message="Supabase is not configured yet. Add your API keys to .env — see docs/BACKEND.md." />
      )}

      {successMessage ? <AuthSuccessBanner message={successMessage} /> : null}

      <AuthInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setSuccessMessage(null);
          setEmail(text);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={(text) => {
          setSuccessMessage(null);
          setPassword(text);
        }}
        placeholder="At least 6 characters"
        secureTextEntry
        showPasswordToggle
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSignUp}
      />
      {passwordHint ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            marginTop: -16,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {passwordHint}
        </Text>
      ) : null}

      <AuthButton
        label={successMessage ? 'Check your inbox' : 'Create Account'}
        loadingLabel="Creating account..."
        onPress={handleSignUp}
        loading={isBusy}
        disabled={!ENV.isSupabaseConfigured || Boolean(successMessage)}
      />
    </AuthScreenLayout>
  );
}
