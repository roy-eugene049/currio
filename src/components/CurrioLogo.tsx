import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { BRAND } from '@/theme/brand';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Open C with a curiosity spark at the gap — original mark. */
const C_PATH =
  'M 78 28 C 48 28 28 48 28 72 C 28 96 48 116 78 116 C 92 116 104 110 112 100';

const C_LENGTH = 200;

type CurrioLogoVariant = 'default' | 'hero';

interface CurrioLogoProps {
  size?: number;
  color?: string;
  animate?: boolean;
  variant?: CurrioLogoVariant;
}

export function CurrioLogo({
  size = 120,
  color = BRAND.electric,
  animate = true,
  variant = 'default',
}: CurrioLogoProps) {
  const isHero = variant === 'hero';
  const drawProgress = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.85 : 1);
  const glowOpacity = useSharedValue(animate ? 0 : 0.15);
  const sparkOpacity = useSharedValue(animate ? 0 : 0.9);

  useEffect(() => {
    if (!animate) return;

    scale.value = withSequence(
      withTiming(isHero ? 1.08 : 1.06, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) }),
    );

    drawProgress.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    glowOpacity.value = withDelay(
      500,
      withTiming(isHero ? 0.22 : 0.2, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      }),
    );

    sparkOpacity.value = withDelay(
      650,
      withTiming(0.9, { duration: 350, easing: Easing.out(Easing.quad) }),
    );
  }, [animate, drawProgress, glowOpacity, isHero, scale, sparkOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: C_LENGTH * (1 - drawProgress.value),
  }));

  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedSparkProps = useAnimatedProps(() => ({
    opacity: sparkOpacity.value,
  }));

  const strokeWidth = isHero ? 13 : 12;
  const glowRadius = isHero ? 62 : 58;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Animated.View style={[styles.centered, containerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 140 140">
          <AnimatedCircle
            animatedProps={animatedGlowProps}
            cx="70"
            cy="70"
            r={glowRadius}
            fill={color}
          />
          <AnimatedPath
            animatedProps={animatedPathProps}
            d={C_PATH}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={C_LENGTH}
          />
          <AnimatedCircle
            animatedProps={animatedSparkProps}
            cx="98"
            cy="42"
            r={isHero ? 7 : 6}
            fill={BRAND.lavender}
          />
        </Svg>
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
