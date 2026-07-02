import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

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
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: colors.border,
          opacity: isDisabled && !loading ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={[styles.buttonLabel, { color: colors.text }]}>
            Continue with Google
          </Text>
        </>
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
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
