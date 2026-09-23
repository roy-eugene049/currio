import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CurrioLogo } from '@/components/CurrioLogo';
import { CurrioWordmark, CurrioWordmarkTagline } from '@/components/CurrioWordmark';
import { BRAND } from '@/theme/brand';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in dev fast refresh
});

const MIN_SPLASH_MS = 2600;

interface AnimatedSplashProps {
  ready: boolean;
  onComplete: () => void;
}

export function AnimatedSplash({ ready, onComplete }: AnimatedSplashProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const screenOpacity = useSharedValue(1);
  const wordmarkScale = useSharedValue(1);
  const wordmarkOpacity = useSharedValue(1);
  const taglineOpacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !minTimeElapsed) return;

    taglineOpacity.value = withTiming(0, {
      duration: 380,
      easing: Easing.in(Easing.quad),
    });

    wordmarkScale.value = withTiming(1.05, {
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
    });

    wordmarkOpacity.value = withTiming(0, {
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
    });

    screenOpacity.value = withTiming(
      0,
      { duration: 480, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      },
    );
  }, [
    minTimeElapsed,
    onComplete,
    ready,
    screenOpacity,
    taglineOpacity,
    wordmarkOpacity,
    wordmarkScale,
  ]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const wordmarkWrapStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));

  const taglineWrapStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <View style={styles.background} />

      <Animated.View style={[styles.content, wordmarkWrapStyle]}>
        <CurrioLogo size={112} variant="hero" animate />
        <View style={styles.wordmarkSlot}>
          <CurrioWordmark size={56} animate />
        </View>
        <Animated.View style={taglineWrapStyle}>
          <CurrioWordmarkTagline animate />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.deep,
  },
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BRAND.deep,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  wordmarkSlot: {
    marginTop: 28,
  },
});
