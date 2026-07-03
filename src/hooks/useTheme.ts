import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';
import { NEUMO } from '@/theme/neumorphic';

export function useTheme() {
  const themeMode = useAppStore((s) => s.themeMode);
  const systemScheme = useSystemColorScheme();
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const palette = isDark ? NEUMO.dark : NEUMO.light;

  return {
    isDark,
    themeMode,
    brand: BRAND,
    light: LIGHT,
    colors: isDark
      ? {
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          textMuted: palette.textMuted,
          textSecondary: BRAND.lavender,
          border: `${BRAND.lavender}33`,
          borderStrong: `${BRAND.lavender}55`,
          primary: BRAND.electric,
          secondary: BRAND.lavender,
          accent: BRAND.electric,
          icon: BRAND.lavender,
          iconMuted: `${BRAND.lavender}99`,
          chrome: `${BRAND.deep}CC`,
          chromeBorder: `${BRAND.lavender}44`,
          input: '#334155',
          inputBorder: `${BRAND.lavender}44`,
          chip: '#334155',
          chipBorder: `${BRAND.lavender}22`,
          surfaceMuted: BRAND.deepMuted,
          streak: BRAND.lavender,
          glow: BRAND.glow,
          gradientScreen: [BRAND.deep, '#1E0040', BRAND.deepMuted] as const,
        }
      : {
          background: LIGHT.canvas,
          card: LIGHT.surface,
          text: LIGHT.text,
          textMuted: LIGHT.textMuted,
          textSecondary: LIGHT.textSecondary,
          border: LIGHT.border,
          borderStrong: LIGHT.borderStrong,
          primary: BRAND.electric,
          secondary: BRAND.lavender,
          accent: BRAND.electric,
          icon: LIGHT.icon,
          iconMuted: LIGHT.iconMuted,
          chrome: LIGHT.chrome,
          chromeBorder: LIGHT.chromeBorder,
          input: LIGHT.input,
          inputBorder: LIGHT.inputBorder,
          chip: LIGHT.chip,
          chipBorder: LIGHT.chipBorder,
          surfaceMuted: LIGHT.surfaceMuted,
          streak: LIGHT.streakText,
          glow: BRAND.glow,
          gradientScreen: LIGHT.gradient.screen,
        },
  };
}
