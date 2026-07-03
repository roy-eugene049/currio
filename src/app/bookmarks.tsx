import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkLibraryCard } from '@/components/bookmarks/BookmarkLibraryCard';
import {
  BookmarksFilterRail,
  type BookmarkFilter,
} from '@/components/bookmarks/BookmarksFilterRail';
import { useProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { getBookmarkedCurios } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import { BRAND } from '@/theme/brand';
import type { Category } from '@/types/curio';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const palette = useProfilePalette(isDark);

  const bookmarkIds = useAppStore((s) => s.bookmarks);
  const interests = useAppStore((s) => s.interests);

  const [activeFilter, setActiveFilter] = useState<BookmarkFilter>('All');

  const savedCurrios = useMemo(
    () => getBookmarkedCurios([...bookmarkIds].reverse()),
    [bookmarkIds],
  );

  const topicFilters = useMemo((): Category[] => {
    if (interests.length > 0) return interests;
    return [...new Set(savedCurrios.map((curio) => curio.category))];
  }, [interests, savedCurrios]);

  const filteredCurrios = useMemo(() => {
    if (activeFilter === 'All') return savedCurrios;
    return savedCurrios.filter((curio) => curio.category === activeFilter);
  }, [activeFilter, savedCurrios]);

  const openCurrio = (id: string) => {
    router.push(`/currio/${id}` as Href);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={palette.gradient}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.mesh, styles.meshOne, { opacity: isDark ? 0.35 : 0.22 }]} />
      <View style={[styles.mesh, styles.meshTwo, { opacity: isDark ? 0.2 : 0.14 }]} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backHit}
          >
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={palette.blurTint}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color={palette.tileTitle} />
            </BlurView>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: palette.kicker }]}>YOUR COLLECTION</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: palette.tileTitle }]}>Saved</Text>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor: isDark ? `${BRAND.electric}33` : `${BRAND.electric}18`,
                    borderColor: isDark ? `${BRAND.lavender}44` : `${BRAND.electric}30`,
                  },
                ]}
              >
                <Text style={[styles.countText, { color: BRAND.electric }]}>
                  {savedCurrios.length}
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: palette.tileSubtitle }]}>
              Currios you&apos;ve bookmarked to revisit
            </Text>
          </View>
        </Animated.View>

        <BookmarksFilterRail
          topics={topicFilters}
          active={activeFilter}
          onChange={setActiveFilter}
          isDark={isDark}
          textColor={palette.tileTitle}
          mutedColor={palette.tileSubtitle}
        />

        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {savedCurrios.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: isDark ? `${BRAND.deepMuted}CC` : colors.card,
                  borderColor: isDark ? `${BRAND.lavender}28` : colors.border,
                },
              ]}
            >
              <LinearGradient
                colors={[BRAND.electric, '#9B4DFF']}
                style={styles.emptyIcon}
              >
                <Ionicons name="bookmark" size={26} color={BRAND.mist} />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: palette.tileTitle }]}>
                Your shelf is empty
              </Text>
              <Text style={[styles.emptyBody, { color: palette.tileSubtitle }]}>
                Save currios from home and they&apos;ll land here — ready whenever you
                want another spark of curiosity.
              </Text>
            </View>
          ) : filteredCurrios.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: isDark ? `${BRAND.deepMuted}CC` : colors.card,
                  borderColor: isDark ? `${BRAND.lavender}28` : colors.border,
                },
              ]}
            >
              <Ionicons name="options-outline" size={28} color={BRAND.electric} />
              <Text style={[styles.emptyTitle, { color: palette.tileTitle }]}>
                No matches for this topic
              </Text>
              <Text style={[styles.emptyBody, { color: palette.tileSubtitle }]}>
                Pick another filter above or bookmark more currios in this category.
              </Text>
              <Pressable
                onPress={() => setActiveFilter('All')}
                style={styles.resetBtn}
                accessibilityRole="button"
              >
                <Text style={styles.resetText}>Show all topics</Text>
              </Pressable>
            </View>
          ) : (
            filteredCurrios.map((curio, index) => (
              <BookmarkLibraryCard
                key={curio.id}
                curio={curio}
                index={index}
                isDark={isDark}
                onPress={() => openCurrio(curio.id)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mesh: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND.electric,
  },
  meshOne: {
    width: 280,
    height: 280,
    top: -120,
    right: -90,
  },
  meshTwo: {
    width: 200,
    height: 200,
    bottom: 80,
    left: -80,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  backHit: {
    marginTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${BRAND.lavender}22`,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '92%',
  },
  list: {
    paddingHorizontal: 20,
  },
  empty: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: `${BRAND.electric}22`,
  },
  resetText: {
    color: BRAND.electric,
    fontSize: 14,
    fontWeight: '700',
  },
});
