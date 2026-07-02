import { Ionicons } from '@expo/vector-icons';
import { Pressable, Share, Text, View } from 'react-native';

import { BookmarkButton } from '@/components/BookmarkButton';
import { CategoryChip } from '@/components/CategoryChip';
import { useTheme } from '@/hooks/useTheme';
import type { Curio } from '@/types/curio';

interface CurioCardProps {
  curio: Curio;
}

export function CurioCard({ curio }: CurioCardProps) {
  const { colors } = useTheme();

  const handleShare = async () => {
    const message = `${curio.title}\n\n${curio.content}\n\n— Currio`;
    await Share.share({ message });
  };

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        <CategoryChip category={curio.category} size="sm" />
        <View className="flex-row items-center gap-4">
          <BookmarkButton curioId={curio.id} />
          <Pressable
            onPress={handleShare}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share currio"
          >
            <Ionicons name="share-outline" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <Text
        className="text-2xl font-bold leading-tight"
        style={{ color: colors.text }}
      >
        {curio.title}
      </Text>

      {curio.image ? (
        <View
          className="h-40 rounded-2xl items-center justify-center"
          style={{ backgroundColor: colors.border }}
        >
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        </View>
      ) : (
        <View
          className="h-32 rounded-2xl items-center justify-center overflow-hidden"
          style={{
            backgroundColor: `${colors.primary}12`,
          }}
        >
          <Ionicons
            name="sparkles"
            size={28}
            color={colors.primary}
            style={{ opacity: 0.6 }}
          />
        </View>
      )}

      <Text
        className="text-base leading-7"
        style={{ color: colors.textMuted }}
      >
        {curio.content}
      </Text>

      <View className="flex-row items-center gap-2 pt-2">
        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
        <Text className="text-sm" style={{ color: colors.textMuted }}>
          {curio.readingTime} read
        </Text>
      </View>
    </View>
  );
}
