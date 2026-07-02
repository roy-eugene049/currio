import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SettingsTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: ReactNode;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

export function SettingsTile({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = false,
  rightElement,
  toggleValue,
  onToggle,
}: SettingsTileProps) {
  const { colors, isDark } = useTheme();

  const content = (
    <View
      className="flex-row items-center px-4 py-4 gap-4"
      style={{ backgroundColor: 'transparent' }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${colors.primary}15` }}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
      {onToggle !== undefined && toggleValue !== undefined && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isDark ? '#F8FAFC' : '#FFFFFF'}
        />
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}
