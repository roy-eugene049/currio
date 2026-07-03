import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CATEGORY_ICONS } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types/curio';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function CategoryChip({
  category,
  selected = false,
  onPress,
  size = 'md',
}: CategoryChipProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        animatedStyle,
        {
          backgroundColor: selected ? colors.primary : colors.chip,
          borderWidth: selected ? 0 : 1,
          borderColor: colors.chipBorder,
          paddingHorizontal: size === 'sm' ? 12 : 16,
          paddingVertical: size === 'sm' ? 6 : 12,
          borderRadius: 9999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          ...(selected || isDark
            ? {}
            : {
                shadowColor: '#3B0270',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }),
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${category}${selected ? ', selected' : ''}`}
    >
      <Ionicons
        name={CATEGORY_ICONS[category] as keyof typeof Ionicons.glyphMap}
        size={size === 'sm' ? 14 : 16}
        color={selected ? '#FFFFFF' : colors.textMuted}
      />
      <Text
        className={`${textSize} font-medium`}
        style={{ color: selected ? '#FFFFFF' : colors.text }}
      >
        {category}
      </Text>
    </AnimatedPressable>
  );
}
