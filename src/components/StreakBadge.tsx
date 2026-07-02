import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

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
        backgroundColor: isDark ? '#334155' : '#FEF3C7',
      }}
    >
      <Text className="text-sm">🔥</Text>
      <Text
        className="text-sm font-semibold"
        style={{ color: isDark ? '#FCD34D' : '#D97706' }}
      >
        {streak} Day{streak !== 1 ? 's' : ''} Streak
      </Text>
    </View>
  );
}
