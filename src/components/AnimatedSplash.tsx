import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CurrioLogo } from '@/components/CurrioLogo';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in dev fast refresh
});

const MIN_SPLASH_MS = 2200;

interface AnimatedSplashProps {
  ready: boolean;
  onComplete: () => void;
}

export function AnimatedSplash({ ready, onComplete }: AnimatedSplashProps) {
  const { colors } = useTheme();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    titleOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    titleTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    taglineOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
  }, [taglineOpacity, titleOpacity, titleTranslateY]);

  useEffect(() => {
    if (!ready || !minTimeElapsed) return;

    screenOpacity.value = withTiming(
      0,
      { duration: 450, easing: Easing.inOut(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      },
    );
  }, [minTimeElapsed, onComplete, ready, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Animated.View
      className="flex-1 items-center justify-center px-8"
      style={[{ backgroundColor: colors.background }, screenStyle]}
    >
      <View className="items-center gap-6">
        <CurrioLogo size={140} color={colors.primary} />
        <Animated.Text
          style={[{ color: colors.text }, titleStyle]}
          className="text-4xl font-bold tracking-tight"
        >
          Currio
        </Animated.Text>
        <Animated.Text
          style={[{ color: colors.textMuted }, taglineStyle]}
          className="text-base text-center leading-6"
        >
          Learn something new every day
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
