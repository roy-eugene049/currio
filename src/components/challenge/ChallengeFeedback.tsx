import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BRAND } from '@/theme/brand';

const PIECE_COLORS = [
  '#22C55E',
  '#4ADE80',
  BRAND.electric,
  BRAND.lavender,
  BRAND.pale,
  BRAND.mist,
] as const;

type Piece = {
  id: number;
  left: number;
  delay: number;
  drift: number;
  spin: number;
  color: string;
  size: number;
};

function buildPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 6 + Math.random() * 88,
    delay: Math.floor(Math.random() * 280),
    drift: (Math.random() - 0.5) * 90,
    spin: (Math.random() - 0.5) * 540,
    color: PIECE_COLORS[id % PIECE_COLORS.length]!,
    size: 6 + Math.random() * 7,
  }));
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }),
    );
  }, [piece.delay, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.55) / 0.45),
      transform: [
        { translateY: t * 280 },
        { translateX: piece.drift * t },
        { rotate: `${piece.spin * t}deg` },
        { scale: 1 - t * 0.25 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        style,
        {
          left: `${piece.left}%`,
          width: piece.size,
          height: piece.size * (piece.id % 2 === 0 ? 0.65 : 1.15),
          backgroundColor: piece.color,
          borderRadius: piece.size > 10 ? 2 : piece.size / 2,
        },
      ]}
    />
  );
}

/** Celebratory burst for a correct curiosity-check answer. */
export function ChallengeConfetti({ active }: { active: boolean }) {
  if (!active) return null;

  const pieces = buildPieces(42);

  return (
    <View pointerEvents="none" style={styles.host}>
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} />
      ))}
    </View>
  );
}

function SoftParticle({
  left,
  delay,
  color,
}: {
  left: number;
  delay: number;
  color: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.4) / 0.6),
      transform: [{ translateY: t * 60 }, { scale: 0.7 + t * 0.5 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.softDot,
        style,
        { left: `${left}%`, backgroundColor: color },
      ]}
    />
  );
}

/** Gentle drift particles for an incorrect (non-punitive) answer. */
export function ChallengeSoftMiss({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    pulse.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [active, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.35 - pulse.value * 0.35),
    transform: [{ scale: 0.7 + pulse.value * 0.9 }],
  }));

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.missHost}>
      <Animated.View style={[styles.missRing, ringStyle]} />
      {[18, 34, 52, 68, 82].map((left, index) => (
        <SoftParticle
          key={left}
          left={left}
          delay={index * 70}
          color={
            index % 2 === 0
              ? 'rgba(239, 68, 68, 0.75)'
              : BRAND.lavender
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 20,
  },
  piece: {
    position: 'absolute',
    top: -12,
  },
  missHost: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 20,
  },
  missRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.55)',
  },
  softDot: {
    position: 'absolute',
    top: '42%',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
