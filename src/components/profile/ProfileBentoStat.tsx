import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { streakBackdropForStreak } from '@/constants/streakBackdropImages';
import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { BRAND } from '@/theme/brand';
import { STREAK } from '@/theme/streak';

type StatKind = 'streak' | 'saved' | 'topics';

interface ProfileBentoStatProps {
  kind: StatKind;
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  hint?: string;
  large?: boolean;
  tilt?: string;
  delay: number;
  palette: ProfilePalette;
  isDark: boolean;
  onPress?: () => void;
}

const STAT_THEMES: Record<
  StatKind,
  {
    border: [string, string];
    iconGradient: [string, string];
    ambient: string;
    iconColor: string;
  }
> = {
  streak: {
    border: [STREAK.flame, STREAK.flameLight],
    iconGradient: [...STREAK.gradient],
    ambient: STREAK.bgDark,
    iconColor: '#FFF8F3',
  },
  saved: {
    border: [BRAND.electric, BRAND.lavender],
    iconGradient: [BRAND.electric, BRAND.lavender],
    ambient: `${BRAND.electric}28`,
    iconColor: BRAND.mist,
  },
  topics: {
    border: [BRAND.lavender, `${BRAND.electric}99`],
    iconGradient: [BRAND.lavender, BRAND.pale],
    ambient: `${BRAND.lavender}40`,
    iconColor: BRAND.deep,
  },
};

export function ProfileBentoStat({
  kind,
  icon,
  value,
  label,
  hint,
  large,
  tilt = '0deg',
  delay,
  palette,
  isDark,
  onPress,
}: ProfileBentoStatProps) {
  const accent = STAT_THEMES[kind];
  const isStreakHero = kind === 'streak' && large;
  const streakBackdrop = isStreakHero
    ? streakBackdropForStreak(typeof value === 'number' ? value : 0)
    : null;

  const valueColor = isStreakHero ? '#FFF8F3' : palette.bentoValue;
  const labelColor = isStreakHero ? 'rgba(255, 248, 243, 0.92)' : palette.bentoLabel;
  const hintColor = isStreakHero ? 'rgba(255, 248, 243, 0.78)' : palette.tileSubtitle;

  const cardBody = (
    <View style={[styles.inner, !isStreakHero && { backgroundColor: palette.bentoInner }]}>
      {isStreakHero && streakBackdrop ? (
        <>
          <Image
            source={{ uri: streakBackdrop }}
            style={styles.backdropImage}
            contentFit="cover"
            transition={320}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={[
              'rgba(40, 8, 0, 0.25)',
              'rgba(180, 55, 0, 0.52)',
              'rgba(25, 5, 0, 0.88)',
            ]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.45)']}
            style={styles.backdropVignette}
          />
        </>
      ) : (
        <View
          style={[
            styles.ambient,
            large ? styles.ambientLarge : styles.ambientSmall,
            { backgroundColor: accent.ambient },
          ]}
        />
      )}

      <View style={styles.topRow}>
        <LinearGradient
          colors={accent.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconRing, large && styles.iconRingLarge]}
        >
          <Ionicons name={icon} size={large ? 24 : 17} color={accent.iconColor} />
        </LinearGradient>

        {onPress ? (
          <View style={[styles.actionBadge, { backgroundColor: palette.iconWrapBg }]}>
            <Ionicons name="arrow-forward" size={14} color={palette.bentoLabel} />
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.value,
            large && styles.valueLarge,
            { color: valueColor },
            isStreakHero && styles.valueOnFire,
          ]}
        >
          {value}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.hint, { color: hintColor }]} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const tiltStyle =
    tilt !== '0deg' ? { flex: 1 as const, transform: [{ rotate: tilt }] } : { flex: 1 as const };

  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={[styles.cell, large ? styles.cellLarge : styles.cellSmall]}
    >
      <View style={tiltStyle}>
        <LinearGradient
          colors={accent.border}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.border}
        >
          {isStreakHero ? (
            <View style={styles.clip}>{cardBody}</View>
          ) : (
            <BlurView
              intensity={isDark ? 36 : 56}
              tint={palette.blurTint}
              style={styles.blur}
            >
              {cardBody}
            </BlurView>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${value} ${label}`}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  cell: {
    flex: 1,
  },
  cellLarge: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 168,
  },
  cellSmall: {
    minHeight: 78,
  },
  border: {
    flex: 1,
    borderRadius: 20,
    padding: 1,
  },
  blur: {
    flex: 1,
    borderRadius: 19,
    overflow: 'hidden',
  },
  clip: {
    flex: 1,
    borderRadius: 19,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropVignette: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  ambient: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientLarge: {
    width: 100,
    height: 100,
    top: -30,
    right: -24,
  },
  ambientSmall: {
    width: 64,
    height: 64,
    top: -18,
    right: -14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingLarge: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  actionBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    zIndex: 1,
    gap: 3,
    marginTop: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 28,
  },
  valueLarge: {
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.4,
  },
  valueOnFire: {
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },
});
