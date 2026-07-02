import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isPrimary
            ? isDisabled
              ? '#A5B4FC'
              : '#4F46E5'
            : 'transparent',
          opacity: isDisabled && !loading ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#4F46E5'} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isPrimary ? '#FFFFFF' : '#4F46E5' },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
