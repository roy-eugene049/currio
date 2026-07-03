import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import {
  tabActiveIndex,
  tabDirection,
  tabProgress,
} from '@/components/navigation/tabTransition';

const SLIDE_DISTANCE = 14;

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  tabIndex: number;
}

export function AnimatedTabScreen({ children, tabIndex }: AnimatedTabScreenProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = tabIndex === tabActiveIndex.value;
    const progress = tabProgress.value;
    const direction = tabDirection.value;

    if (isActive) {
      return {
        opacity: interpolate(progress, [0, 1], [0.98, 1]),
        transform: [
          {
            translateX: interpolate(
              progress,
              [0, 1],
              [direction * SLIDE_DISTANCE, 0],
            ),
          },
        ],
      };
    }

    if (progress < 1) {
      return {
        opacity: interpolate(progress, [0, 0.4], [1, 0]),
      };
    }

    return { opacity: 1 };
  });

  return (
    <Animated.View style={[styles.screen, animatedStyle]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
