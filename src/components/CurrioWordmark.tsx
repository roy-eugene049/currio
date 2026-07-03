import {
  Syne_500Medium,
  Syne_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/syne';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BRAND } from '@/theme/brand';

const WORDMARK = 'Currio';
const ACCENT_INDEX = WORDMARK.length - 1;
const SPARK_INDEX = 4;

interface CurrioWordmarkProps {
  size?: number;
  color?: string;
  accentColor?: string;
  animate?: boolean;
}

function WordmarkLetter({
  letter,
  index,
  progress,
  size,
  color,
  accentColor,
  emphasize,
}: {
  letter: string;
  index: number;
  progress: SharedValue<number>;
  size: number;
  color: string;
  accentColor: string;
  emphasize?: boolean;
}) {
  const isAccent = index === ACCENT_INDEX;

  const letterStyle = useAnimatedStyle(() => {
    const start = index * 0.09;
    const t = interpolate(progress.value, [start, start + 0.42], [0, 1], Extrapolation.CLAMP);

    return {
      opacity: t,
      transform: [
        { translateY: (1 - t) * (emphasize ? 22 : 16) },
        { scale: (emphasize ? 1.08 : 1) * (0.9 + t * 0.1) },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.letter,
        {
          fontSize: size,
          color: isAccent ? accentColor : color,
        },
        letterStyle,
      ]}
    >
      {letter}
    </Animated.Text>
  );
}

function CuriositySpark({
  progress,
  size,
}: {
  progress: SharedValue<number>;
  size: number;
}) {
  const dotSize = size * 0.1;

  const sparkStyle = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [0.38, 0.72], [0, 1], Extrapolation.CLAMP);

    return {
      opacity: t,
      transform: [
        { translateY: (1 - t) * 8 },
        { scale: 0.35 + t * 0.65 },
      ],
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [0.45, 0.8], [0, 1], Extrapolation.CLAMP);

    return {
      opacity: t * 0.45,
      transform: [{ scale: 0.65 + t * 0.55 }],
    };
  });

  return (
    <View pointerEvents="none" style={[styles.sparkWrap, { top: -dotSize * 1.6 }]}>
      <Animated.View
        style={[
          styles.sparkHalo,
          haloStyle,
          {
            width: dotSize * 3,
            height: dotSize * 3,
            borderRadius: dotSize * 1.5,
            backgroundColor: BRAND.mist,
          },
        ]}
      />
      <Animated.View
        style={[
          sparkStyle,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: BRAND.mist,
            shadowColor: BRAND.mist,
            shadowOpacity: 0.95,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
    </View>
  );
}

export function CurrioWordmark({
  size = 64,
  color = BRAND.mist,
  accentColor = BRAND.lavender,
  animate = true,
}: CurrioWordmarkProps) {
  const [fontsLoaded] = useFonts({
    Syne_800ExtraBold,
    Syne_500Medium,
  });

  const progress = useSharedValue(animate ? 0 : 1);
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;

    progress.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });

    breathe.value = withDelay(
      1200,
      withSequence(
        withSpring(1.015, { damping: 14, stiffness: 120 }),
        withSpring(1, { damping: 12, stiffness: 100 }),
      ),
    );
  }, [animate, breathe, progress]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  if (!fontsLoaded) {
    return <View style={{ height: size * 1.2, width: size * 4.2 }} />;
  }

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <View style={styles.row}>
        {WORDMARK.split('').map((letter, index) => {
          const letterNode = (
            <WordmarkLetter
              key={`${letter}-${index}`}
              letter={letter}
              index={index}
              progress={progress}
              size={size}
              color={color}
              accentColor={accentColor}
              emphasize={index === 0}
            />
          );

          if (index === SPARK_INDEX) {
            return (
              <View key={`${letter}-${index}`} style={styles.iSlot}>
                <CuriositySpark progress={progress} size={size} />
                {letterNode}
              </View>
            );
          }

          return letterNode;
        })}
      </View>
    </Animated.View>
  );
}

export function CurrioWordmarkTagline({
  animate = true,
}: {
  animate?: boolean;
}) {
  const [fontsLoaded] = useFonts({ Syne_500Medium });

  const opacity = useSharedValue(animate ? 0 : 1);
  const lift = useSharedValue(animate ? 10 : 0);

  useEffect(() => {
    if (!animate) return;

    opacity.value = withDelay(
      780,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    lift.value = withDelay(
      780,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [animate, lift, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Animated.Text style={[styles.tagline, style]}>
      Curiosity, distilled.
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  letter: {
    fontFamily: 'Syne_800ExtraBold',
    letterSpacing: -2.5,
    includeFontPadding: false,
  },
  iSlot: {
    position: 'relative',
    alignItems: 'center',
  },
  sparkWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sparkHalo: {
    position: 'absolute',
  },
  tagline: {
    marginTop: 18,
    fontFamily: 'Syne_500Medium',
    fontSize: 13,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: `${BRAND.mist}B3`,
  },
});
