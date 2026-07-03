import { Link, useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthConfigBanner } from '@/components/auth/AuthBanner';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { ENV } from '@/constants/env';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { showAuthErrorToast, showToast } from '@/utils/authFeedback';
import { getPostAuthRoute } from '@/utils/navigation';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const navigateAfterAuth = () => {
    const appState = useAppStore.getState();
    router.replace(
      getPostAuthRoute({
        hasCompletedOnboarding: appState.hasCompletedOnboarding,
        hasSeenWelcome: appState.hasSeenWelcome,
      }),
    );
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearError();

    if (!email.trim() || !password) {
      showToast('Please enter your email and password.');
      return;
    }

    try {
      await signIn({ email, password });
      navigateAfterAuth();
    } catch {
      showAuthErrorToast();
    }
  };

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to continue your daily learning journey."
      footer={
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link href={'/(auth)/signup' as Href} asChild>
            <Pressable>
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}
              >
                Create one
              </Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      {!ENV.isSupabaseConfigured && (
        <AuthConfigBanner message="Supabase is not configured yet. Add your API keys to .env — see docs/BACKEND.md." />
      )}

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
        placeholder="Your password"
        secureTextEntry
        showPasswordToggle
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <View style={styles.forgotRow}>
        <Link href={'/(auth)/forgot-password' as Href} asChild>
          <Pressable>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.primary }}>
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>

      <AuthButton
        label="Sign In"
        onPress={handleLogin}
        loading={isLoading}
        disabled={!ENV.isSupabaseConfigured}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 4,
  },
});
