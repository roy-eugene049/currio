import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { CategoryTheme } from '@/theme/categoryThemes';

interface CurioBackdropProps {
  theme: CategoryTheme;
  imageUrl?: string | null;
}

const CROSSFADE_MS = 420;

export function CurioBackdrop({ theme, imageUrl }: CurioBackdropProps) {
  const [slotA, setSlotA] = useState<string | null>(imageUrl ?? null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const activeSlot = useRef<'A' | 'B'>('A');
  const opacityA = useSharedValue(1);
  const opacityB = useSharedValue(0);

  const [gradientA, setGradientA] = useState(theme);
  const [gradientB, setGradientB] = useState<CategoryTheme | null>(null);
  const activeGradient = useRef<'A' | 'B'>('A');
  const gradientOpacityA = useSharedValue(1);
  const gradientOpacityB = useSharedValue(0);

  useEffect(() => {
    if (!imageUrl) return;

    const currentUrl = activeSlot.current === 'A' ? slotA : slotB;
    if (imageUrl === currentUrl) return;

    if (activeSlot.current === 'A') {
      setSlotB(imageUrl);
      opacityB.value = withTiming(1, { duration: CROSSFADE_MS });
      opacityA.value = withTiming(0, { duration: CROSSFADE_MS });
      activeSlot.current = 'B';
      return;
    }

    setSlotA(imageUrl);
    opacityA.value = withTiming(1, { duration: CROSSFADE_MS });
    opacityB.value = withTiming(0, { duration: CROSSFADE_MS });
    activeSlot.current = 'A';
  }, [imageUrl, opacityA, opacityB, slotA, slotB]);

  useEffect(() => {
    const currentTheme = activeGradient.current === 'A' ? gradientA : gradientB;
    if (
      currentTheme?.lensEdge === theme.lensEdge &&
      currentTheme?.lensMid === theme.lensMid
    ) {
      return;
    }

    if (activeGradient.current === 'A') {
      setGradientB(theme);
      gradientOpacityB.value = withTiming(1, { duration: CROSSFADE_MS });
      gradientOpacityA.value = withTiming(0, { duration: CROSSFADE_MS });
      activeGradient.current = 'B';
      return;
    }

    setGradientA(theme);
    gradientOpacityA.value = withTiming(1, { duration: CROSSFADE_MS });
    gradientOpacityB.value = withTiming(0, { duration: CROSSFADE_MS });
    activeGradient.current = 'A';
  }, [theme, gradientA, gradientB, gradientOpacityA, gradientOpacityB]);

  const imageStyleA = useAnimatedStyle(() => ({ opacity: opacityA.value }));
  const imageStyleB = useAnimatedStyle(() => ({ opacity: opacityB.value }));
  const gradientStyleA = useAnimatedStyle(() => ({ opacity: gradientOpacityA.value }));
  const gradientStyleB = useAnimatedStyle(() => ({ opacity: gradientOpacityB.value }));

  return (
    <View style={styles.root} pointerEvents="none">
      {slotA ? (
        <Animated.View style={[StyleSheet.absoluteFill, imageStyleA]}>
          <Image
            source={{ uri: slotA }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
          />
        </Animated.View>
      ) : null}

      {slotB ? (
        <Animated.View style={[StyleSheet.absoluteFill, imageStyleB]}>
          <Image
            source={{ uri: slotB }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
          />
        </Animated.View>
      ) : null}

      <Animated.View style={[StyleSheet.absoluteFill, gradientStyleA]}>
        <LinearGradient
          colors={[`${gradientA.lensEdge}CC`, `${gradientA.lensMid}AA`, `${gradientA.lensEdge}DD`]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {gradientB ? (
        <Animated.View style={[StyleSheet.absoluteFill, gradientStyleB]}>
          <LinearGradient
            colors={[
              `${gradientB.lensEdge}CC`,
              `${gradientB.lensMid}AA`,
              `${gradientB.lensEdge}DD`,
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
