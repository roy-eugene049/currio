import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { BRAND } from '@/theme/brand';

type StatKind = 'streak' | 'saved' | 'topics';

interface ProfileBentoStatProps {
  kind: StatKind;
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  large?: boolean;
  tilt: string;
  delay: number;
  palette: ProfilePalette;
  isDark: boolean;
  onPress?: () => void;
}

const STAT_THEMES: Record<
  StatKind,
  {
    border: [string, string, string];
    iconGradient: [string, string];
    glow: string;
    iconColor: string;
  }
> = {
  streak: {
    border: ['#FF7A45', `${BRAND.electric}88`, '#FFB347'],
    iconGradient: ['#FF6B35', '#FF9F43'],
    glow: '#FF6B3544',
    iconColor: '#FFF8F3',
  },
  saved: {
    border: [BRAND.electric, '#B06BFF', BRAND.lavender],
    iconGradient: [BRAND.electric, '#9B4DFF'],
    glow: `${BRAND.electric}40`,
    iconColor: BRAND.mist,
  },
  topics: {
    border: ['#FF6B9D', BRAND.lavender, `${BRAND.electric}AA`],
    iconGradient: ['#FF6B9D', BRAND.lavender],
    glow: `${BRAND.lavender}55`,
    iconColor: BRAND.deep,
  },
};

export function ProfileBentoStat({
  kind,
  icon,
  value,
  label,
  large,
  tilt,
  delay,
  palette,
  isDark,
  onPress,
}: ProfileBentoStatProps) {
  const accent = STAT_THEMES[kind];

  const content = (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500).springify().damping(16)}
      style={[
        styles.cell,
        large && styles.cellLarge,
        { transform: [{ rotate: tilt }] },
      ]}
    >
      <LinearGradient
        colors={accent.border}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}
      >
        <BlurView intensity={isDark ? 48 : 72} tint={palette.blurTint} style={styles.blur}>
          <View style={[styles.inner, { backgroundColor: palette.bentoInner }]}>
            <View
              style={[
                styles.glowOrb,
                large ? styles.glowOrbLarge : styles.glowOrbSmall,
                { backgroundColor: accent.glow },
              ]}
            />
            <LinearGradient
              colors={[`${accent.border[0]}33`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shine}
            />

            <View style={[styles.topRow, large && styles.topRowLarge]}>
              <LinearGradient
                colors={accent.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.iconRing, large && styles.iconRingLarge]}
              >
                <Ionicons name={icon} size={large ? 26 : 18} color={accent.iconColor} />
              </LinearGradient>
              {large ? (
                <Text style={[styles.kindTag, { color: palette.bentoLabel }]}>
                  {kind === 'streak' ? 'ON FIRE' : ''}
                </Text>
              ) : null}
            </View>

            <View style={styles.copy}>
              <Text
                style={[
                  styles.value,
                  large && styles.valueLarge,
                  { color: palette.bentoValue },
                ]}
              >
                {value}
              </Text>
              <Text style={[styles.label, { color: palette.bentoLabel }]}>{label}</Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${value} ${label}`}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cell: {
    flex: 1,
  },
  cellLarge: {
    flex: 1.1,
  },
  border: {
    flex: 1,
    borderRadius: 24,
    padding: 1.5,
  },
  blur: {
    flex: 1,
    borderRadius: 22.5,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbLarge: {
    width: 120,
    height: 120,
    top: -36,
    right: -28,
  },
  glowOrbSmall: {
    width: 72,
    height: 72,
    top: -22,
    right: -16,
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  topRowLarge: {
    marginBottom: 4,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconRingLarge: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  kindTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  copy: {
    zIndex: 1,
    gap: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 30,
  },
  valueLarge: {
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
