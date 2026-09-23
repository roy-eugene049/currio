import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrioLogo } from '@/components/CurrioLogo';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { BRAND } from '@/theme/brand';
import { getUserDisplayName } from '@/utils/user';

function ExcitedEmoji() {
  const scale = useSharedValue(0.85);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 420, easing: Easing.out(Easing.back(2.2)) }),
        withTiming(1, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.08, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 320, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 180 }),
        withTiming(10, { duration: 360 }),
        withTiming(-6, { duration: 180 }),
        withTiming(0, { duration: 240 }),
      ),
      -1,
      false,
    );
  }, [rotate, scale]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.Text
      accessibilityLabel="Excited"
      style={[styles.emoji, emojiStyle]}
    >
      😊
    </Animated.Text>
  );
}

export default function WelcomeScreen() {
  const { colors, isDark, light } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const completeWelcome = useAppStore((s) => s.completeWelcome);

  const firstName = getUserDisplayName(user);
  const glowScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.55);

  useEffect(() => {
    glowScale.value = withRepeat(
      withTiming(1.06, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    ringOpacity.value = withRepeat(
      withTiming(0.9, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [glowScale, ringOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  const headlineAccentColor = isDark ? BRAND.lavender : BRAND.deep;
  const curioWordColor = isDark ? BRAND.lavender : BRAND.deep;
  const bodyColor = isDark ? colors.textMuted : light.textSecondary;

  const handleContinue = async () => {
    await completeWelcome();
    router.replace('/(tabs)' as Href);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? [BRAND.deepMuted, colors.gradientScreen[1], colors.gradientScreen[2]]
            : [BRAND.mist, light.gradient.welcome[1], light.gradient.welcome[2]]
        }
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.graphics}>
        <View
          style={[
            styles.orb,
            styles.orbTop,
            { backgroundColor: BRAND.electric, opacity: isDark ? 0.2 : 0.14 },
          ]}
        />
        <View
          style={[
            styles.orb,
            styles.orbLeft,
            { backgroundColor: BRAND.lavender, opacity: isDark ? 0.12 : 0.16 },
          ]}
        />
        <View
          style={[
            styles.orb,
            styles.orbRight,
            { backgroundColor: BRAND.deep, opacity: isDark ? 0.25 : 0.08 },
          ]}
        />
        <View style={[styles.spark, styles.sparkOne, { backgroundColor: BRAND.electric }]} />
        <View style={[styles.spark, styles.sparkTwo, { backgroundColor: BRAND.lavender }]} />
        <View style={[styles.spark, styles.sparkThree, { backgroundColor: BRAND.electric }]} />
      </View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(700)} style={styles.hero}>
            <Animated.View style={[styles.ringOuter, ringStyle, { borderColor: `${BRAND.electric}44` }]} />
            <Animated.View style={[styles.ringInner, ringStyle, { borderColor: `${BRAND.lavender}66` }]} />
            <Animated.View style={[styles.glow, glowStyle]}>
              <LinearGradient
                colors={
                  isDark
                    ? [`${BRAND.electric}50`, `${BRAND.electric}10`, 'transparent']
                    : [`${BRAND.mint}`, `${BRAND.lavender}35`, 'transparent']
                }
                style={styles.glowGradient}
              />
            </Animated.View>
            <CurrioLogo
              size={88}
              color={isDark ? BRAND.lavender : BRAND.deep}
              animate
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(180).duration(580)} style={styles.copy}>
            <View style={styles.headlineBlock}>
              <Text style={[styles.headline, { color: colors.text }]}>Welcome,</Text>
              <View style={styles.nameRow}>
                <Text style={[styles.headlineAccent, { color: headlineAccentColor }]}>
                  {firstName}
                </Text>
                <ExcitedEmoji />
              </View>
            </View>

            <Text style={[styles.body, { color: bodyColor }]}>
              You&apos;re all set — your{' '}
              <Text style={[styles.curioWord, { color: curioWordColor }]}>first currio</Text>
              {' '}is waiting!
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(360).duration(520)} style={styles.footer}>
          <Pressable
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Open today's currio"
            style={({ pressed }) => [styles.buttonWrap, pressed && styles.buttonPressed]}
          >
            <LinearGradient
              colors={[BRAND.electric, BRAND.deep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Open today&apos;s currio</Text>
              <Ionicons name="arrow-forward" size={18} color={BRAND.mist} />
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
  graphics: {
    ...StyleSheet.absoluteFill,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTop: {
    width: 280,
    height: 280,
    top: -90,
    right: -70,
  },
  orbLeft: {
    width: 160,
    height: 160,
    bottom: '22%',
    left: -50,
  },
  orbRight: {
    width: 120,
    height: 120,
    top: '38%',
    right: -30,
  },
  spark: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  sparkOne: {
    width: 8,
    height: 8,
    top: '24%',
    left: '18%',
  },
  sparkTwo: {
    width: 6,
    height: 6,
    top: '32%',
    right: '20%',
  },
  sparkThree: {
    width: 5,
    height: 5,
    bottom: '34%',
    right: '28%',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    width: 180,
    height: 180,
  },
  ringOuter: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
  },
  ringInner: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
  },
  glow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 95,
  },
  copy: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  headlineBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  headline: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 46,
    width: '100%',
  },
  headlineAccent: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 46,
  },
  emoji: {
    fontSize: 34,
    lineHeight: 40,
    marginTop: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
    width: '100%',
  },
  curioWord: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 14,
    alignItems: 'center',
  },
  buttonWrap: {
    width: '100%',
    borderRadius: 999,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  button: {
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: BRAND.mist,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
