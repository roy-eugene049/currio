import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function LoadingSkeleton() {
  const { isDark } = useTheme();
  const bg = isDark ? '#334155' : '#E2E8F0';

  return (
    <View className="gap-4">
      <View className="h-8 w-32 rounded-full" style={{ backgroundColor: bg }} />
      <View
        className="rounded-card p-6 gap-4"
        style={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}
      >
        <View className="h-6 w-24 rounded-full" style={{ backgroundColor: bg }} />
        <View className="h-10 w-full rounded-lg" style={{ backgroundColor: bg }} />
        <View className="h-32 w-full rounded-2xl" style={{ backgroundColor: bg }} />
        <View className="h-4 w-full rounded" style={{ backgroundColor: bg }} />
        <View className="h-4 w-full rounded" style={{ backgroundColor: bg }} />
        <View className="h-4 w-3/4 rounded" style={{ backgroundColor: bg }} />
      </View>
    </View>
  );
}
