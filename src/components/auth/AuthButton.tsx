import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  loadingLabel,
  disabled = false,
  variant = 'primary',
}: AuthButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  if (!isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.ghostButton, { opacity: isDisabled && !loading ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <Text style={[styles.ghostLabel, { color: colors.primary }]}>
            {loadingLabel ?? label}
          </Text>
        ) : (
          <Text style={[styles.ghostLabel, { color: colors.primary }]}>{label}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.primaryWrap,
        pressed && !isDisabled && styles.pressed,
        isDisabled && !loading && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <LinearGradient
        colors={
          isDisabled && !loading
            ? [`${BRAND.lavender}99`, `${BRAND.lavender}77`]
            : [BRAND.electric, BRAND.deep]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryButton}
      >
        {loading ? (
          <>
            <ActivityIndicator color={BRAND.mist} />
            <Text style={styles.primaryLabel}>{loadingLabel ?? label}</Text>
          </>
        ) : (
          <Text style={styles.primaryLabel}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    marginTop: 20,
    borderRadius: 16,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.mist,
  },
  ghostButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 20,
  },
  ghostLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.75,
  },
});
