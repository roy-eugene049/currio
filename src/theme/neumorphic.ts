import type { ViewStyle } from 'react-native';

import { BRAND } from '@/theme/brand';

export const NEUMO = {
  light: {
    background: BRAND.mist,
    surface: '#F5E8F8',
    shadowDark: `${BRAND.deep}33`,
    shadowLight: '#FFFFFF',
    accent: BRAND.electric,
    text: BRAND.deep,
    textMuted: `${BRAND.deep}99`,
  },
  dark: {
    background: BRAND.deep,
    surface: BRAND.deepMuted,
    shadowDark: '#120022',
    shadowLight: `${BRAND.electric}22`,
    accent: BRAND.electric,
    text: BRAND.mist,
    textMuted: BRAND.lavender,
  },
} as const;

export function neumorphicRaised(isDark: boolean, radius = 24): ViewStyle {
  const palette = isDark ? NEUMO.dark : NEUMO.light;
  return {
    backgroundColor: palette.surface,
    borderRadius: radius,
    shadowColor: isDark ? BRAND.electric : palette.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.25 : 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDark ? `${BRAND.lavender}22` : `${BRAND.electric}18`,
  };
}

export function neumorphicInset(isDark: boolean, radius = 20): ViewStyle {
  const palette = isDark ? NEUMO.dark : NEUMO.light;
  return {
    backgroundColor: palette.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: isDark ? `${BRAND.deep}88` : `${BRAND.electric}15`,
    shadowColor: palette.shadowDark,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: isDark ? 0.4 : 0.1,
    shadowRadius: 6,
    elevation: 0,
  };
}

export function neumorphicCircle(isDark: boolean, size: number): ViewStyle {
  return {
    ...neumorphicRaised(isDark, size / 2),
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
  };
}
