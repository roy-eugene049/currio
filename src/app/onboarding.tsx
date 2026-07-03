import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopicSelector } from '@/components/TopicSelector';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { BRAND } from '@/theme/brand';
import type { Category } from '@/types/curio';

const MIN_INTERESTS = 3;

export default function OnboardingScreen() {
  const { colors, isDark, light } = useTheme();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<Category[]>([]);

  const toggleCategory = (category: Category) => {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleContinue = async () => {
    if (selected.length < MIN_INTERESTS) return;
    await completeOnboarding(selected);
    router.replace('/welcome' as Href);
  };

  const canContinue = selected.length >= MIN_INTERESTS;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? [colors.gradientScreen[0], colors.gradientScreen[1], colors.gradientScreen[2]]
            : [...light.gradient.screen]
        }
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowOne, { opacity: isDark ? 0.12 : 0.08 }]} />
      <View style={[styles.glow, styles.glowTwo, { opacity: isDark ? 0.08 : 0.05 }]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Animated.View entering={FadeInUp.duration(500)} style={styles.kickerWrap}>
            <Text style={[styles.kicker, { color: colors.primary }]}>
              Welcome to Currio
            </Text>
          </Animated.View>

          <TopicSelector selected={selected} onToggle={toggleCategory} />
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {selected.length} selected · Pick at least {MIN_INTERESTS}
          </Text>
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            accessibilityLabel="Continue to Currio"
            style={[styles.buttonWrap, !canContinue && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={
                canContinue
                  ? [BRAND.electric, BRAND.deep]
                  : [`${BRAND.lavender}99`, `${BRAND.lavender}77`]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Start Learning</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
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
  },
  glowOne: {
    width: 240,
    height: 240,
    top: -80,
    right: -60,
  },
  glowTwo: {
    width: 160,
    height: 160,
    bottom: 100,
    left: -50,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  body: {
    flex: 1,
    paddingTop: 24,
  },
  kickerWrap: {
    marginBottom: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    paddingBottom: 16,
  },
  counter: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 14,
    fontWeight: '500',
  },
  buttonWrap: {
    borderRadius: 18,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0.08,
    elevation: 2,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: BRAND.mist,
    fontSize: 16,
    fontWeight: '700',
  },
});
