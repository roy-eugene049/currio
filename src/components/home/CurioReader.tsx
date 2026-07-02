import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkButton } from '@/components/BookmarkButton';
import { CurioBackdrop } from '@/components/home/CurioBackdrop';
import { CurioStreakBadge } from '@/components/home/CurioStreakBadge';
import { AppChromeChip } from '@/components/ui/AppChromeChip';
import { GlassChip } from '@/components/ui/GlassChip';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { getCategoryTheme } from '@/theme/categoryThemes';
import type { Curio } from '@/types/curio';

interface CurioReaderProps {
  curio: Curio;
  bottomInset: number;
  onNextCurio?: (currentCurioId: string) => Promise<unknown>;
  isLoadingNext?: boolean;
}

export function CurioReader({
  curio,
  bottomInset,
  onNextCurio,
  isLoadingNext = false,
}: CurioReaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, brand } = useTheme();
  const streak = useAppStore((s) => s.streak);
  const theme = getCategoryTheme(curio.category);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    if (isLoadingNext) {
      iconRotation.value = withRepeat(withTiming(360, { duration: 700 }), -1, false);
      return;
    }
    iconRotation.value = 0;
  }, [iconRotation, isLoadingNext]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handleShare = async () => {
    await Share.share({
      message: `${curio.title}\n\n${curio.content}\n\n— Currio`,
    });
  };

  const handleNext = () => {
    if (isLoadingNext || !onNextCurio) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    void onNextCurio(curio.id)
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      })
      .catch(() => {});
  };

  return (
    <View style={styles.root}>
      <Animated.View
        key={curio.category}
        entering={FadeIn.duration(450)}
        exiting={FadeOut.duration(280)}
        style={styles.backdropLayer}
      >
        <CurioBackdrop theme={theme} />
      </Animated.View>

      <View style={[styles.content, { paddingBottom: bottomInset }]}>
        <Animated.View
          key={curio.id}
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          exiting={FadeOutUp.duration(220)}
          style={styles.currioBlock}
        >
          <Text
            style={[
              styles.title,
              { color: theme.textPrimary, textShadowColor: theme.textShadow },
            ]}
          >
            {curio.title}
          </Text>
          <Text
            style={[
              styles.body,
              { color: theme.textSecondary, textShadowColor: theme.textShadow },
            ]}
          >
            {curio.content}
          </Text>
        </Animated.View>

        {onNextCurio ? (
          <Pressable
            onPress={handleNext}
            disabled={isLoadingNext}
            accessibilityRole="button"
            accessibilityLabel="Show another currio"
            style={({ pressed }) => [styles.nextPressable, pressed && styles.nextPressed]}
          >
            <LinearGradient
              colors={[brand.electric, brand.deep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButton}
            >
              <Animated.View style={iconAnimatedStyle}>
                <Ionicons name="shuffle-outline" size={18} color={brand.mist} />
              </Animated.View>
              <Text style={styles.nextLabel}>
                {isLoadingNext ? 'Finding one…' : 'Another currio'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>

      <Animated.View
        key={`bar-${curio.id}`}
        entering={FadeIn.delay(120).duration(300)}
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 16 }]}
      >
        <GlassChip theme={theme} style={styles.categoryChip}>
          <Text style={[styles.category, { color: theme.accent }]}>
            {curio.category}
          </Text>
        </GlassChip>

        <View style={styles.topActions}>
          <CurioStreakBadge streak={streak} />
          <AppChromeChip style={styles.iconBtn}>
            <BookmarkButton curioId={curio.id} size={19} />
          </AppChromeChip>
          <AppChromeChip style={styles.iconBtn}>
            <Pressable onPress={handleShare} hitSlop={8} accessibilityLabel="Share">
              <Ionicons name="share-outline" size={19} color={colors.icon} />
            </Pressable>
          </AppChromeChip>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  currioBlock: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 20,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  body: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '500',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  nextPressable: {
    zIndex: 3,
    elevation: 3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#6F00FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  nextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF1F1',
    letterSpacing: 0.2,
  },
  nextPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 12,
    zIndex: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
  },
});
