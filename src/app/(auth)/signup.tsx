import { Link, useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput } from 'react-native';

import {
  AuthConfigBanner,
  AuthErrorBanner,
  AuthSuccessBanner,
} from '@/components/auth/AuthBanner';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { ENV } from '@/constants/env';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthRoute } from '@/utils/navigation';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const navigateAfterAuth = () => {
    router.replace(
      getPostAuthRoute({ hasCompletedOnboarding, hasSeenWelcome }),
    );
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signUp({ email, password });
      const session = useAuthStore.getState().session;
      if (session) {
        navigateAfterAuth();
        return;
      }
      setSuccessMessage(
        'Account created! Check your email to confirm, then sign in.',
      );
    } catch {
      // Error stored in auth store
    }
  };

  const displayError = localError ?? error;
  const passwordHint =
    password.length > 0 && password.length < 6
      ? `${6 - password.length} more character${6 - password.length === 1 ? '' : 's'} needed`
      : null;

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Join Currio and start discovering something new every day."
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
      {displayError ? <AuthErrorBanner message={displayError} /> : null}

      <AuthInput
        label="Email"
        value={email}
        onChangeText={setEmail}
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
        onChangeText={setPassword}
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
        label="Create Account"
        onPress={handleSignUp}
        loading={isLoading}
        disabled={!ENV.isSupabaseConfigured}
      />
    </AuthScreenLayout>
  );
}
