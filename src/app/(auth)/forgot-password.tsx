import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, Text } from 'react-native';

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
import { useAuthStore } from '@/store/useAuthStore';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    Keyboard.dismiss();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    try {
      await resetPassword({ email });
      setSent(true);
    } catch {
      // Error stored in auth store
    }
  };

  const displayError = localError ?? error;

  return (
    <AuthScreenLayout
      title="Reset password"
      subtitle="We'll send you a link to reset your password."
      footer={
        <Link href={'/(auth)/login' as Href} asChild>
          <Pressable>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
              Back to sign in
            </Text>
          </Pressable>
        </Link>
      }
    >
      {!ENV.isSupabaseConfigured && (
        <AuthConfigBanner message="Supabase is not configured yet. Add your API keys to .env — see docs/BACKEND.md." />
      )}

      {sent ? (
        <AuthSuccessBanner
          message={`If an account exists for ${email}, you'll receive a reset link shortly. Check your inbox and spam folder.`}
        />
      ) : null}

      {!sent && displayError ? <AuthErrorBanner message={displayError} /> : null}

      {!sent && (
        <>
          <AuthInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleReset}
          />
          <AuthButton
            label="Send Reset Link"
            onPress={handleReset}
            loading={isLoading}
            disabled={!ENV.isSupabaseConfigured}
          />
        </>
      )}
    </AuthScreenLayout>
  );
}
