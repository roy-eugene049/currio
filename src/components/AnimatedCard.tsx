import type { ReactNode } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({
  children,
  delay = 0,
  className = '',
}: AnimatedCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600).springify().damping(18)}
      className={`rounded-card p-6 ${className}`}
      style={{
        backgroundColor: colors.card,
        shadowColor: isDark ? '#000' : colors.borderStrong,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: isDark ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </Animated.View>
  );
}
