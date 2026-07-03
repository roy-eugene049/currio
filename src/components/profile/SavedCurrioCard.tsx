import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryChip } from '@/components/CategoryChip';
import type { Curio } from '@/types/curio';

type SavedCardPalette = {
  tileBg: string;
  tileBorder: string;
  tileTitle: string;
  tileSubtitle: string;
  tileAccent: [string, string];
};

interface SavedCurrioCardProps {
  curio: Curio;
  onPress: () => void;
  palette: SavedCardPalette;
}

export function SavedCurrioCard({ curio, onPress, palette }: SavedCurrioCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open saved currio: ${curio.title}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.tileBg,
            borderColor: palette.tileBorder,
          },
        ]}
      >
        <LinearGradient
          colors={palette.tileAccent}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.accent}
        />
        <View style={styles.body}>
          <CategoryChip category={curio.category} size="sm" />
          <Text
            style={[styles.title, { color: palette.tileTitle }]}
            numberOfLines={2}
          >
            {curio.title}
          </Text>
          <Text
            style={[styles.preview, { color: palette.tileSubtitle }]}
            numberOfLines={2}
          >
            {curio.content}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.tileSubtitle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 18,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  preview: {
    fontSize: 13,
    lineHeight: 19,
  },
});
