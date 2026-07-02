import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { BRAND } from '@/theme/brand';
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
    colors: {
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      textMuted: palette.textMuted,
      border: isDark ? `${BRAND.lavender}33` : `${BRAND.deep}22`,
      primary: BRAND.electric,
      secondary: BRAND.lavender,
      accent: BRAND.electric,
      icon: BRAND.lavender,
      chrome: isDark ? `${BRAND.deep}CC` : `${BRAND.mist}E6`,
      chromeBorder: isDark ? `${BRAND.lavender}44` : `${BRAND.electric}33`,
      streak: BRAND.lavender,
      glow: BRAND.glow,
    },
  };
}
