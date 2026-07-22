import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';
import type { Curio } from '@/types/curio';

interface BookmarkLibraryCardProps {
  curio: Curio;
  index: number;
  onPress: () => void;
  onOrganize?: () => void;
  isDark: boolean;
}

export function BookmarkLibraryCard({
  curio,
  index,
  onPress,
  onOrganize,
  isDark,
}: BookmarkLibraryCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(420).springify()}>
      <LinearGradient
        colors={
          isDark
            ? [`${BRAND.electric}28`, `${BRAND.lavender}10`]
            : [`${BRAND.electric}14`, `${BRAND.lavender}22`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? `${BRAND.deepMuted}EE` : colors.card,
              borderColor: isDark ? `${BRAND.lavender}20` : colors.border,
            },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[styles.category, { color: BRAND.electric }]}>
              {curio.category.toUpperCase()}
            </Text>
            <View style={styles.actions}>
              {onOrganize ? (
                <Pressable
                  onPress={onOrganize}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add to collection"
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isDark
                        ? `${BRAND.electric}28`
                        : `${BRAND.electric}12`,
                    },
                  ]}
                >
                  <Ionicons name="folder-outline" size={14} color={BRAND.electric} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={onPress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Open ${curio.title}`}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: isDark
                      ? `${BRAND.electric}28`
                      : `${BRAND.electric}12`,
                  },
                ]}
              >
                <Ionicons name="arrow-forward" size={14} color={BRAND.electric} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Open saved currio: ${curio.title}`}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text
              style={[styles.title, { color: isDark ? BRAND.mist : LIGHT.text }]}
              numberOfLines={2}
            >
              {curio.title}
            </Text>

            <Text
              style={[
                styles.preview,
                { color: isDark ? `${BRAND.mist}B3` : LIGHT.textMuted },
              ]}
              numberOfLines={3}
            >
              {curio.content}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.94,
  },
  border: {
    borderRadius: 22,
    padding: 1,
    marginBottom: 12,
  },
  card: {
    borderRadius: 21,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
