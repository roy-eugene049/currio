import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopicSelector } from '@/components/TopicSelector';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import type { Category } from '@/types/curio';

const MIN_INTERESTS = 3;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<Category[]>([]);

  const toggleCategory = (category: Category) => {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleContinue = async () => {
    if (selected.length < MIN_INTERESTS) return;
    await completeOnboarding(selected);
    router.replace('/welcome' as Href);
  };

  const canContinue = selected.length >= MIN_INTERESTS;

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{ backgroundColor: colors.background }}
    >
      <View className="pt-8 flex-1">
        <Animated.View entering={FadeInUp.duration(500)} className="mb-2">
          <Text className="text-sm font-semibold tracking-widest uppercase" style={{ color: colors.primary }}>
            Welcome to Currio
          </Text>
        </Animated.View>

        <TopicSelector selected={selected} onToggle={toggleCategory} />
      </View>

      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        className="pb-6"
      >
        <Text
          className="text-center text-sm mb-4"
          style={{ color: colors.textMuted }}
        >
          {selected.length} selected · Pick at least {MIN_INTERESTS}
        </Text>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className="rounded-2xl py-4 items-center"
          style={{
            backgroundColor: canContinue ? colors.primary : colors.border,
            opacity: canContinue ? 1 : 0.6,
          }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          accessibilityLabel="Continue to Currio"
        >
          <Text className="text-base font-semibold text-white">
            Start Learning
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
