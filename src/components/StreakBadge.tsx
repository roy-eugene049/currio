import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { STREAK } from '@/theme/streak';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { isDark } = useTheme();

  if (streak <= 0) return null;

  return (
    <View
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: isDark ? STREAK.bgDark : STREAK.bg,
        borderWidth: 1,
        borderColor: isDark ? STREAK.borderDark : STREAK.border,
      }}
    >
      <Text className="text-sm">🔥</Text>
      <Text
        className="text-sm font-semibold"
        style={{ color: isDark ? STREAK.textOnDark : STREAK.text }}
      >
        {streak} Day{streak !== 1 ? 's' : ''} Streak
      </Text>
    </View>
  );
}
