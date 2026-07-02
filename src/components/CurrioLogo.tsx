import { useEffect } from 'react';
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

import { COLORS } from '@/constants';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CurrioLogoProps {
  size?: number;
  color?: string;
  animate?: boolean;
}

export function CurrioLogo({
  size = 120,
  color = COLORS.primary,
  animate = true,
}: CurrioLogoProps) {
  const drawProgress = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.85 : 1);
  const glowOpacity = useSharedValue(animate ? 0 : 0.15);

  useEffect(() => {
    if (!animate) return;

    scale.value = withSequence(
      withTiming(1.06, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) }),
    );
    drawProgress.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    glowOpacity.value = withDelay(
      500,
      withTiming(0.2, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
  }, [animate, drawProgress, glowOpacity, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cPath =
    'M 78 28 C 48 28 28 48 28 72 C 28 96 48 116 78 116 C 92 116 104 110 112 100';

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: 200 * (1 - drawProgress.value),
  }));

  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={containerStyle}>
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <AnimatedCircle
          animatedProps={animatedGlowProps}
          cx="70"
          cy="70"
          r="58"
          fill={color}
        />
        <AnimatedPath
          animatedProps={animatedPathProps}
          d={cPath}
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="200"
        />
        <Circle
          cx="98"
          cy="42"
          r="6"
          fill={COLORS.accent}
          opacity={0.9}
        />
      </Svg>
    </Animated.View>
  );
}
