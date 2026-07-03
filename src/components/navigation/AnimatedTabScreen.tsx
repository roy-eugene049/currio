import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import {
  tabActiveIndex,
  tabDirection,
  tabProgress,
} from '@/components/navigation/tabTransition';

const SLIDE_DISTANCE = 24;
const LIFT_DISTANCE = 10;

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  tabIndex: number;
}

export function AnimatedTabScreen({ children, tabIndex }: AnimatedTabScreenProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (tabIndex !== tabActiveIndex.value) {
      return {};
    }

    const progress = tabProgress.value;
    const direction = tabDirection.value;

    return {
      opacity: interpolate(progress, [0, 1], [0.94, 1]),
      transform: [
        { translateX: interpolate(progress, [0, 1], [direction * SLIDE_DISTANCE, 0]) },
        { translateY: interpolate(progress, [0, 1], [LIFT_DISTANCE, 0]) },
      ],
    };
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
