import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BookmarkButtonProps {
  curioId: string;
  size?: number;
  iconColor?: string;
}

export function BookmarkButton({
  curioId,
  size = 24,
  iconColor,
}: BookmarkButtonProps) {
  const { colors } = useTheme();
  const bookmarked = useAppStore((s) => s.isBookmarked(curioId));
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const scale = useSharedValue(1);

  const color = iconColor ?? colors.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
    toggleBookmark(curioId);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={animatedStyle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Ionicons
        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={bookmarked ? colors.primary : color}
      />
    </AnimatedPressable>
  );
}
