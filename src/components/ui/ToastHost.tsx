import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTabBarInset } from '@/components/navigation/FloatingTabBar';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';
import { STREAK } from '@/theme/streak';
import { useToastStore, type FeedbackVariant } from '@/store/useToastStore';

const DISMISS_MS = 2800;
const PILL_VARIANTS = new Set<FeedbackVariant>(['bookmark', 'topics']);

type ToastVisualConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  border: string;
  iconColor: string;
  shadowColor: string;
  shadowOpacity: number;
};

const BANNER_VARIANT_CONFIG: Record<FeedbackVariant, ToastVisualConfig> = {
  bookmark: {
    icon: 'bookmark',
    gradient: [BRAND.electric, BRAND.deep],
    border: `${BRAND.electric}55`,
    iconColor: BRAND.mist,
    shadowColor: BRAND.electric,
    shadowOpacity: 0.22,
  },
  topics: {
    icon: 'sparkles',
    gradient: [BRAND.electric, BRAND.deep],
    border: `${BRAND.electric}55`,
    iconColor: BRAND.mist,
    shadowColor: BRAND.electric,
    shadowOpacity: 0.22,
  },
  success: {
    icon: 'checkmark-circle',
    gradient: ['#34D399', '#059669'],
    border: '#34D39966',
    iconColor: '#FFFFFF',
    shadowColor: '#34D399',
    shadowOpacity: 0.22,
  },
  error: {
    icon: 'alert-circle',
    gradient: [STREAK.flame, '#DC2626'],
    border: '#F8717166',
    iconColor: '#FFFFFF',
    shadowColor: STREAK.flame,
    shadowOpacity: 0.22,
  },
};

function getPillVisualConfig(
  variant: FeedbackVariant,
  isDark: boolean,
): ToastVisualConfig {
  const base = BANNER_VARIANT_CONFIG[variant];

  if (isDark) {
    return {
      ...base,
      gradient: [`${BRAND.lavender}88`, `${BRAND.electric}44`],
      border: `${BRAND.lavender}33`,
      iconColor: BRAND.lavender,
      shadowColor: BRAND.electric,
      shadowOpacity: 0.14,
    };
  }

  return {
    ...base,
    gradient: [LIGHT.canvasGlow, LIGHT.surfaceMuted],
    border: LIGHT.chipBorder,
    iconColor: BRAND.electric,
    shadowColor: LIGHT.shadow,
    shadowOpacity: 0.08,
  };
}

function getPillSurface(isDark: boolean) {
  return {
    backgroundColor: isDark ? `${BRAND.deepMuted}F0` : LIGHT.chip,
  };
}

function FeedbackIcon({
  config,
  size = 'default',
}: {
  config: ToastVisualConfig;
  size?: 'default' | 'pill';
}) {
  const pulse = useSharedValue(1);
  const isPill = size === 'pill';

  useEffect(() => {
    pulse.value = 0.6;
    pulse.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 260 }),
    );
  }, [pulse, config.icon]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={isPill ? styles.pillIconRing : styles.iconRing}
      >
        <Ionicons
          name={config.icon}
          size={isPill ? 14 : 18}
          color={config.iconColor}
        />
      </LinearGradient>
    </Animated.View>
  );
}

function PillToast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: FeedbackVariant;
  onDismiss: () => void;
}) {
  const { colors, isDark } = useTheme();
  const config = getPillVisualConfig(variant, isDark);
  const surface = getPillSurface(isDark);

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.pill,
        surface,
        {
          borderColor: config.border,
          shadowColor: config.shadowColor,
          shadowOpacity: config.shadowOpacity,
        },
      ]}
    >
      <FeedbackIcon config={config} size="pill" />
      <Text style={[styles.pillText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </Pressable>
  );
}

function BannerToast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: FeedbackVariant;
  onDismiss: () => void;
}) {
  const { colors, isDark } = useTheme();
  const config = BANNER_VARIANT_CONFIG[variant];

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          backgroundColor: isDark ? '#1A1028F2' : '#FFFFFFF2',
          borderColor: config.border,
          shadowColor: config.shadowColor,
          shadowOpacity: config.shadowOpacity,
        },
      ]}
    >
      <FeedbackIcon config={config} />
      <View style={styles.copy}>
        <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
      </View>
      <Ionicons
        name="close"
        size={16}
        color={isDark ? `${BRAND.lavender}99` : colors.textMuted}
      />
    </Pressable>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const hide = useToastStore((s) => s.hide);

  const bottom = getTabBarInset(insets.bottom) + 12;
  const isPill = PILL_VARIANTS.has(variant);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(hide, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18).stiffness(220)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="box-none"
      style={[styles.host, { bottom }]}
    >
      {isPill ? (
        <PillToast message={message} variant={variant} onDismiss={hide} />
      ) : (
        <BannerToast message={message} variant={variant} onDismiss={hide} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  pillIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  toast: {
    maxWidth: 380,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
