import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface AuthErrorBannerProps {
  message: string;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        isDark ? styles.errorDark : styles.errorLight,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isDark ? '#FCA5A5' : '#B91C1C' },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

interface AuthConfigBannerProps {
  message: string;
}

export function AuthConfigBanner({ message }: AuthConfigBannerProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        isDark ? styles.warningDark : styles.warningLight,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isDark ? '#FCD34D' : '#92400E' },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

interface AuthSuccessBannerProps {
  message: string;
}

export function AuthSuccessBanner({ message }: AuthSuccessBannerProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        isDark ? styles.successDark : styles.successLight,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isDark ? '#6EE7B7' : '#047857' },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorDark: {
    backgroundColor: '#450A0A',
    borderColor: '#7F1D1D',
  },
  warningLight: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  warningDark: {
    backgroundColor: '#451A03',
    borderColor: '#78350F',
  },
  successLight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  successDark: {
    backgroundColor: '#064E3B',
    borderColor: '#065F46',
  },
});
