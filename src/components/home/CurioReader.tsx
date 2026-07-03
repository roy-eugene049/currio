import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkButton } from '@/components/BookmarkButton';
import { CurioBackdrop } from '@/components/home/CurioBackdrop';
import { CurioStreakBadge } from '@/components/home/CurioStreakBadge';
import { AppChromeChip } from '@/components/ui/AppChromeChip';
import { GlassChip } from '@/components/ui/GlassChip';
import { CATEGORY_ICONS } from '@/constants';
import { useCurioExperience } from '@/hooks/useCurioExperience';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { getCategoryTheme } from '@/theme/categoryThemes';
import type { Curio } from '@/types/curio';

interface CurioReaderProps {
  curio: Curio;
  bottomInset: number;
  onNextCurio?: (currentCurioId: string) => Promise<unknown>;
  isLoadingNext?: boolean;
  isNextReady?: boolean;
  onBack?: () => void;
  variant?: 'default' | 'saved';
}

export function CurioReader({
  curio,
  bottomInset,
  onNextCurio,
  isLoadingNext = false,
  isNextReady = false,
  onBack,
  variant = 'default',
}: CurioReaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, brand } = useTheme();
  const streak = useAppStore((s) => s.streak);
  const theme = getCategoryTheme(curio.category);
  const { backdropUrl } = useCurioExperience(curio);
  const isSavedView = variant === 'saved';
  const categoryIcon = CATEGORY_ICONS[curio.category] as keyof typeof Ionicons.glyphMap;
  const nextScale = useSharedValue(1);
  const horizontalGutter = Math.max(insets.left, insets.right) + 24;
  const topChrome = insets.top + (isSavedView ? 64 : 80);

  const nextButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));

  const handleShare = async () => {
    await Share.share({
      message: `${curio.title}\n\n${curio.content}\n\n— Currio`,
    });
  };

  const handleNext = () => {
    if (isLoadingNext || !onNextCurio) return;

    nextScale.value = withSpring(0.96, { damping: 14, stiffness: 320 }, () => {
      nextScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    });

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
      <View style={styles.backdropLayer}>
        <CurioBackdrop theme={theme} imageUrl={backdropUrl} />
      </View>

      <View style={[styles.readerStage, { paddingHorizontal: horizontalGutter }]}>
        <View
          style={[
            styles.textStage,
            {
              paddingTop: topChrome,
              paddingBottom: isSavedView ? bottomInset + 72 : 0,
            },
          ]}
        >
          <ScrollView
            style={styles.textScroll}
            contentContainerStyle={[
              styles.textScrollContent,
              { paddingBottom: isSavedView ? 0 : bottomInset + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              key={curio.id}
              entering={FadeIn.duration(240)}
              exiting={FadeOut.duration(160)}
            >
              <View style={styles.currioBlock}>
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

                {onNextCurio ? (
                  <Pressable
                    onPress={handleNext}
                    disabled={isLoadingNext}
                    accessibilityRole="button"
                    accessibilityLabel="Show another currio"
                    accessibilityState={{ busy: isLoadingNext }}
                    style={({ pressed }) => [
                      styles.nextPressable,
                      pressed && styles.nextPressed,
                    ]}
                  >
                    <Animated.View style={nextButtonStyle}>
                      <LinearGradient
                        colors={[brand.electric, brand.deep]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.nextButton,
                          isNextReady && styles.nextButtonReady,
                        ]}
                      >
                        <Ionicons name="shuffle-outline" size={22} color={brand.mist} />
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </View>

      {isSavedView ? (
        <View
          pointerEvents="box-none"
          style={[styles.savedTopBar, { paddingTop: insets.top + 12, paddingHorizontal: horizontalGutter }]}
        >
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <LinearGradient
                colors={[`${theme.accent}55`, `${theme.accent}18`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.savedTopBtnBorder}
              >
                <BlurView
                  intensity={36}
                  tint="dark"
                  style={[styles.savedTopBtn, { backgroundColor: theme.glassBg }]}
                >
                  <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
                </BlurView>
              </LinearGradient>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable
            onPress={handleShare}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <LinearGradient
              colors={[`${theme.accent}55`, `${theme.accent}18`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.savedTopBtnBorder}
            >
              <BlurView
                intensity={36}
                tint="dark"
                style={[styles.savedTopBtn, { backgroundColor: theme.glassBg }]}
              >
                <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
              </BlurView>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <View
          pointerEvents="box-none"
          style={[styles.topBar, { paddingTop: insets.top + 16, paddingHorizontal: horizontalGutter }]}
        >
          <View style={styles.topLeft}>
            {onBack ? (
              <AppChromeChip style={styles.iconBtn}>
                <Pressable
                  onPress={onBack}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={19} color={colors.icon} />
                </Pressable>
              </AppChromeChip>
            ) : null}
            <GlassChip theme={theme} style={styles.categoryChip}>
              <Text style={[styles.category, { color: theme.accent }]}>
                {curio.category}
              </Text>
            </GlassChip>
          </View>

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
        </View>
      )}

      {isSavedView ? (
        <View
          pointerEvents="none"
          style={[styles.bottomTopic, { bottom: bottomInset + 20 }]}
        >
          <LinearGradient
            colors={[`${theme.accent}88`, `${theme.accent}22`, `${theme.accent}55`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottomTopicBorder}
          >
            <View
              style={[
                styles.bottomTopicInner,
                {
                  backgroundColor: theme.glassBg,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              <Ionicons name={categoryIcon} size={15} color={theme.accent} />
              <Text style={[styles.bottomTopicText, { color: theme.accent }]}>
                {curio.category}
              </Text>
            </View>
          </LinearGradient>
        </View>
      ) : null}
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
  readerStage: {
    flex: 1,
    zIndex: 1,
  },
  textStage: {
    flex: 1,
  },
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  currioBlock: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
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
    alignSelf: 'center',
    width: '100%',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  nextPressable: {
    marginTop: 28,
    alignSelf: 'center',
    zIndex: 3,
    elevation: 3,
  },
  nextButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6F00FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  nextButtonReady: {
    shadowOpacity: 0.55,
    shadowRadius: 18,
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
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 2,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
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
  savedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 2,
  },
  savedTopBtnBorder: {
    borderRadius: 16,
    padding: 1,
  },
  savedTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTopic: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    transform: [{ rotate: '-1.5deg' }],
  },
  bottomTopicBorder: {
    borderRadius: 999,
    padding: 1,
  },
  bottomTopicInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  bottomTopicText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
