import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

interface ScreenBackgroundProps {
  children: React.ReactNode;
}

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const { colors, isDark } = useTheme();

  if (isDark) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...colors.gradientScreen]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowOne]} />
      <View style={[styles.glow, styles.glowTwo]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND.electric,
    opacity: 0.06,
  },
  glowOne: {
    width: 260,
    height: 260,
    top: -90,
    right: -70,
  },
  glowTwo: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -60,
  },
});
