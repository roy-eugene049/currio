import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type CurrioLogoVariant = 'default' | 'hero';

interface CurrioLogoProps {
  size?: number;
  /** Kept for call-site compatibility; brand mark image carries its own colors. */
  color?: string;
  animate?: boolean;
  variant?: CurrioLogoVariant;
}

const LOGO_MARK = require('../../assets/images/logo-mark.png');

export function CurrioLogo({
  size = 120,
  animate = true,
  variant = 'default',
}: CurrioLogoProps) {
  const isHero = variant === 'hero';
  const scale = useSharedValue(animate ? 0.86 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;

    opacity.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });

    scale.value = withSequence(
      withTiming(isHero ? 1.08 : 1.05, {
        duration: 620,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, { duration: 280, easing: Easing.inOut(Easing.quad) }),
    );
  }, [animate, isHero, opacity, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Animated.View style={[styles.centered, containerStyle]}>
        <Image
          source={LOGO_MARK}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
