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
import { useCollectionSheetStore } from '@/store/useCollectionSheetStore';
import { showActionFeedback } from '@/utils/actionFeedback';

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
  const openSaveSheet = useCollectionSheetStore((s) => s.openSaveSheet);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const color = iconColor ?? colors.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const handlePress = () => {
    const wasBookmarked = bookmarked;

    scale.value = withSequence(
      withSpring(1.28, { damping: 9, stiffness: 380 }),
      withSpring(1, { damping: 14, stiffness: 280 }),
    );

    rotate.value = withSequence(
      withSpring(wasBookmarked ? -12 : 10, { damping: 10, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 220 }),
    );

    void (async () => {
      await toggleBookmark(curioId);
      if (wasBookmarked) {
        showActionFeedback('bookmark-removed');
        return;
      }
      showActionFeedback('bookmark');
      openSaveSheet(curioId);
    })();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={animatedStyle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? 'Remove from saves' : 'Save for later'}
    >
      <Ionicons
        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={bookmarked ? colors.primary : color}
      />
    </AnimatedPressable>
  );
}
