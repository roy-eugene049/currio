import type { ViewStyle } from 'react-native';

import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';

export const NEUMO = {
  light: {
    background: LIGHT.canvas,
    surface: LIGHT.surfaceRaised,
    shadowDark: `${LIGHT.shadow}1A`,
    shadowLight: '#FFFFFF',
    accent: BRAND.electric,
    text: LIGHT.text,
    textMuted: LIGHT.textMuted,
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
    shadowColor: isDark ? BRAND.electric : LIGHT.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.25 : 0.1,
    shadowRadius: isDark ? 16 : 22,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDark ? `${BRAND.lavender}22` : LIGHT.border,
  };
}

export function neumorphicInset(isDark: boolean, radius = 20): ViewStyle {
  const palette = isDark ? NEUMO.dark : NEUMO.light;
  return {
    backgroundColor: palette.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: isDark ? `${BRAND.deep}88` : LIGHT.chipBorder,
    shadowColor: palette.shadowDark,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: isDark ? 0.4 : 0.06,
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
