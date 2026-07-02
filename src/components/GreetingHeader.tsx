import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface GreetingHeaderProps {
  subtitle?: string;
}

export function GreetingHeader({ subtitle = "Today's currio" }: GreetingHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="mb-6">
      <Text
        className="text-base font-medium"
        style={{ color: colors.textMuted }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
