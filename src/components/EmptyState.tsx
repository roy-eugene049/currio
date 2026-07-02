import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({
  icon = 'leaf-outline',
  title,
  message,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View className="items-center justify-center py-16 px-8 gap-3">
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${colors.primary}15` }}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text
        className="text-lg font-semibold text-center"
        style={{ color: colors.text }}
      >
        {title}
      </Text>
      {message && (
        <Text
          className="text-base text-center leading-6"
          style={{ color: colors.textMuted }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
