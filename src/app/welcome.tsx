import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrioLogo } from '@/components/CurrioLogo';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { BRAND } from '@/theme/brand';
import { getUserDisplayName } from '@/utils/user';

export default function WelcomeScreen() {
  const { colors, isDark, light } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const completeWelcome = useAppStore((s) => s.completeWelcome);
  const interests = useAppStore((s) => s.interests);

  const firstName = getUserDisplayName(user);

  const handleContinue = async () => {
    await completeWelcome();
    router.replace('/(tabs)' as Href);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? [colors.gradientScreen[0], colors.gradientScreen[1], colors.gradientScreen[2]]
            : [...light.gradient.welcome]
        }
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeIn.delay(200).duration(800)}
        style={[styles.orb, styles.orbPrimary, { opacity: isDark ? 0.2 : 0.12 }]}
      />
      <Animated.View
        entering={FadeIn.delay(400).duration(800)}
        style={[styles.orb, styles.orbAccent, { opacity: isDark ? 0.15 : 0.09 }]}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View entering={ZoomIn.delay(100).duration(600).springify()}>
            <CurrioLogo size={100} color={colors.primary} animate={false} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.textBlock}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome, {firstName}!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Your account is ready. You&apos;ve picked {interests.length} topic
              {interests.length !== 1 ? 's' : ''} — your first currio is waiting.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                {
                  backgroundColor: isDark ? `${BRAND.deepMuted}EE` : colors.card,
                  borderColor: isDark ? `${BRAND.lavender}22` : colors.border,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.primary }]}>1</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Day streak starts now
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.footer}>
          <Pressable onPress={handleContinue} style={styles.buttonWrap}>
            <LinearGradient
              colors={[BRAND.electric, BRAND.deep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Open today&apos;s currio</Text>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Learn something new every day
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND.electric,
  },
  orbPrimary: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
  },
  orbAccent: {
    width: 200,
    height: 200,
    bottom: 120,
    left: -70,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 300,
  },
  statsRow: {
    marginTop: 32,
    width: '100%',
  },
  statPill: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: BRAND.deep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  buttonWrap: {
    borderRadius: 20,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: BRAND.mist,
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
  },
});
