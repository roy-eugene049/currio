import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

export function LoadingSkeleton() {
  const { colors, isDark } = useTheme();
  const bg = isDark ? colors.input : colors.surfaceMuted;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={[styles.block, styles.hero, { backgroundColor: bg }]} />
      <View style={[styles.block, styles.title, { backgroundColor: bg }]} />
      <View style={[styles.block, styles.line, { backgroundColor: bg }]} />
      <View style={[styles.block, styles.lineShort, { backgroundColor: bg }]} />
      <View style={[styles.block, styles.card, { backgroundColor: bg }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 16,
  },
  block: {
    borderRadius: 16,
    opacity: 0.55,
  },
  hero: {
    height: 120,
    borderRadius: 24,
    marginBottom: 8,
  },
  title: {
    height: 32,
    width: '70%',
    borderRadius: 12,
  },
  line: {
    height: 18,
    width: '100%',
  },
  lineShort: {
    height: 18,
    width: '85%',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    marginTop: 8,
  },
});
