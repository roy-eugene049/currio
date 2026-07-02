import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CategoryChip } from '@/components/CategoryChip';
import { CATEGORIES } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types/curio';

interface TopicSelectorProps {
  selected: Category[];
  onToggle: (category: Category) => void;
}

export function TopicSelector({ selected, onToggle }: TopicSelectorProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1">
      <Animated.Text
        entering={FadeInDown.duration(500)}
        className="text-3xl font-bold mb-2"
        style={{ color: colors.text }}
      >
        What interests you?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(100).duration(500)}
        className="text-base mb-8 leading-6"
        style={{ color: colors.textMuted }}
      >
        Choose topics you&apos;d love to learn about. We&apos;ll personalize your
        daily currios.
      </Animated.Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-row flex-wrap gap-3 pb-32"
      >
        {CATEGORIES.map((category, index) => (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(150 + index * 30).duration(400)}
          >
            <CategoryChip
              category={category}
              selected={selected.includes(category)}
              onPress={() => onToggle(category)}
            />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
