import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';
import type { Category } from '@/types/curio';

export type BookmarkFilter = 'All' | Category;

interface BookmarksFilterRailProps {
  topics: Category[];
  active: BookmarkFilter;
  onChange: (filter: BookmarkFilter) => void;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
}

export function BookmarksFilterRail({
  topics,
  active,
  onChange,
  isDark,
  textColor,
  mutedColor,
}: BookmarksFilterRailProps) {
  if (topics.length === 0) return null;

  const isFiltered = active !== 'All';
  const options: BookmarkFilter[] = ['All', ...topics];

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
              { backgroundColor: isDark ? `${BRAND.deep}CC` : LIGHT.surface },
            ]}
          >
            <View style={styles.metaRow}>
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={[BRAND.electric, `${BRAND.lavender}DD`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="options-outline" size={17} color={BRAND.mist} />
                </LinearGradient>
                {isFiltered ? <View style={styles.activeDot} /> : null}
              </View>
              <View style={styles.metaCopy}>
                <Text style={[styles.kicker, { color: mutedColor }]}>FILTER BY TOPIC</Text>
                <Text style={[styles.activeLabel, { color: textColor }]}>
                  {active === 'All' ? 'All topics' : active}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pills}
            >
              {options.map((option) => {
                const selected = active === option;
                const label = option === 'All' ? 'All topics' : option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={[BRAND.electric, '#9B4DFF']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.pillActive}
                      >
                        <Text style={styles.pillActiveText}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.pill,
                          {
                            borderColor: isDark ? `${BRAND.lavender}33` : LIGHT.border,
                            backgroundColor: isDark ? `${BRAND.deepMuted}88` : LIGHT.chip,
                          },
                        ]}
                      >
                        <Text style={[styles.pillText, { color: mutedColor }]}>{label}</Text>
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
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  iconWrap: {
    position: 'relative',
  },
  iconGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND.lavender,
    borderWidth: 2,
    borderColor: BRAND.deep,
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
  pills: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pillActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.mist,
  },
});
