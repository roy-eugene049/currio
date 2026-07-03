import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

/** Google Identity button palette (light / dark). */
const GOOGLE_BUTTON = {
  light: {
    background: '#FFFFFF',
    border: '#747775',
    text: '#1F1F1F',
    pressed: '#F8F8F8',
  },
  dark: {
    background: '#131314',
    border: '#8E918F',
    text: '#E3E3E3',
    pressed: '#1A1A1B',
  },
} as const;

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = 'or' }: AuthDividerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const { isDark } = useTheme();
  const palette = isDark ? GOOGLE_BUTTON.dark : GOOGLE_BUTTON.light;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed && !isDisabled ? palette.pressed : palette.background,
          borderColor: isDark ? `${BRAND.lavender}66` : palette.border,
          opacity: isDisabled && !loading ? 0.55 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          <GoogleLogo size={20} />
          <Text style={[styles.buttonLabel, { color: palette.text }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  button: {
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#3C4043',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
