import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CATEGORY_ICONS } from '@/constants';
import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';
import type { Category } from '@/types/curio';

export type BookmarkFilter = 'All' | Category;

interface BookmarksFilterRailProps {
  topics: Category[];
  counts: Partial<Record<Category, number>>;
  totalCount: number;
  active: BookmarkFilter;
  onChange: (filter: BookmarkFilter) => void;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
}

export function BookmarksFilterRail({
  topics,
  counts,
  totalCount,
  active,
  onChange,
  isDark,
  textColor,
  mutedColor,
}: BookmarksFilterRailProps) {
  if (topics.length === 0) return null;

  const isFiltered = active !== 'All';
  const options: BookmarkFilter[] = ['All', ...topics];
  const activeCount = active === 'All' ? totalCount : counts[active] ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
      <LinearGradient
        colors={
          isDark
            ? [`${BRAND.electric}55`, `${BRAND.lavender}22`, `${BRAND.electric}33`]
            : [`${BRAND.electric}33`, `${BRAND.lavender}44`, `${BRAND.electric}22`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.border}
      >
        <BlurView intensity={isDark ? 52 : 78} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <View
            style={[
              styles.inner,
              {
                backgroundColor: isDark ? `${BRAND.deep}CC` : '#FFFFFFD9',
                borderColor: isDark ? `${BRAND.lavender}18` : `${BRAND.lavender}55`,
              },
            ]}
          >
            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                <LinearGradient
                  colors={[BRAND.deep, BRAND.electric]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="filter" size={16} color={BRAND.mist} />
                </LinearGradient>
                <View style={styles.metaCopy}>
                  <Text style={[styles.kicker, { color: mutedColor }]}>FILTERS</Text>
                  <Text style={[styles.activeLabel, { color: textColor }]}>
                    {active === 'All' ? 'All saved currios' : active}
                  </Text>
                </View>
              </View>

              {isFiltered ? (
                <Pressable
                  onPress={() => onChange('All')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear topic filter"
                  style={({ pressed }) => [
                    styles.clearButton,
                    {
                      backgroundColor: isDark ? `${BRAND.lavender}18` : `${BRAND.mint}CC`,
                      borderColor: isDark ? `${BRAND.lavender}2E` : `${BRAND.lavender}99`,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.clearText, { color: isDark ? BRAND.lavender : BRAND.deep }]}>
                    Clear
                  </Text>
                </Pressable>
              ) : (
                <Text style={[styles.resultCount, { color: mutedColor }]}>
                  {activeCount} saved
                </Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pills}
            >
              {options.map((option) => {
                const selected = active === option;
                const label = option === 'All' ? 'All topics' : option;
                const count = option === 'All' ? totalCount : counts[option] ?? 0;
                const icon =
                  option === 'All'
                    ? 'albums-outline'
                    : (CATEGORY_ICONS[option] as keyof typeof Ionicons.glyphMap);

                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${label}, ${count} saved`}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={[BRAND.deep, BRAND.electric]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pillActive}
                      >
                        <View style={styles.pillIconActive}>
                          <Ionicons name={icon} size={14} color={BRAND.mist} />
                        </View>
                        <Text style={styles.pillActiveText}>{label}</Text>
                        <View style={styles.countBadgeActive}>
                          <Text style={styles.countBadgeActiveText}>{count}</Text>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.pill,
                          {
                            borderColor: isDark ? `${BRAND.lavender}28` : `${BRAND.lavender}80`,
                            backgroundColor: isDark ? `${BRAND.deepMuted}66` : '#FFF8FFF0',
                          },
                        ]}
                      >
                        <Ionicons
                          name={icon}
                          size={14}
                          color={isDark ? `${BRAND.lavender}CC` : BRAND.electric}
                        />
                        <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
                        <View
                          style={[
                            styles.countBadge,
                            {
                              backgroundColor: isDark ? `${BRAND.lavender}18` : LIGHT.chip,
                            },
                          ]}
                        >
                          <Text style={[styles.countBadgeText, { color: mutedColor }]}>
                            {count}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginBottom: 18,
  },
  border: {
    borderRadius: 22,
    padding: 1,
  },
  blur: {
    borderRadius: 21,
    overflow: 'hidden',
  },
  inner: {
    borderWidth: 1,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
  },
  metaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  activeLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  clearButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
  pills: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  pillIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${BRAND.mist}1F`,
  },
  pillActiveText: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.mist,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countBadgeActive: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: `${BRAND.mist}26`,
  },
  countBadgeActiveText: {
    color: BRAND.mist,
    fontSize: 11,
    fontWeight: '900',
  },
});
