import { useQuery } from '@tanstack/react-query';
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
  BookmarksFilterButton,
  BookmarksFilterSheet,
  type BookmarkFilter,
} from '@/components/bookmarks/BookmarksFilterSheet';
import { useProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { getBookmarkedCurios, resolveBookmarkedCurios } from '@/services/curioService';
import { isRemoteCuriosEnabled } from '@/services/curioApiService';
import { useAppStore } from '@/store/useAppStore';
import { useCollectionSheetStore } from '@/store/useCollectionSheetStore';
import { BRAND } from '@/theme/brand';
import type { Category } from '@/types/curio';
import { sortCollections } from '@/utils/collections';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const palette = useProfilePalette(isDark);

  const bookmarkIds = useAppStore((s) => s.bookmarks);
  const interests = useAppStore((s) => s.interests);
  const collections = useAppStore((s) => s.collections);
  const openSaveSheet = useCollectionSheetStore((s) => s.openSaveSheet);
  const remoteEnabled = isRemoteCuriosEnabled();

  const [activeFilter, setActiveFilter] = useState<BookmarkFilter>({ type: 'all' });
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: savedCurrios = [] } = useQuery({
    queryKey: ['bookmarks', bookmarkIds, remoteEnabled],
    queryFn: async () => {
      const ids = [...bookmarkIds].reverse();
      if (remoteEnabled) {
        return resolveBookmarkedCurios(ids);
      }
      return getBookmarkedCurios(ids);
    },
    enabled: bookmarkIds.length > 0,
    staleTime: 30_000,
  });

  const topicCounts = useMemo(() => {
    return savedCurrios.reduce<Partial<Record<Category, number>>>((counts, curio) => {
      counts[curio.category] = (counts[curio.category] ?? 0) + 1;
      return counts;
    }, {});
  }, [savedCurrios]);

  const topicFilters = useMemo((): Category[] => {
    const savedCategories = [...new Set(savedCurrios.map((curio) => curio.category))];
    const interestOrder = new Map(interests.map((category, index) => [category, index]));

    return savedCategories.sort((a, b) => {
      const aOrder = interestOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = interestOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b);
    });
  }, [interests, savedCurrios]);

  const sortedCollections = useMemo(
    () => sortCollections(collections),
    [collections],
  );

  const resolvedFilter = useMemo((): BookmarkFilter => {
    if (activeFilter.type === 'all') return activeFilter;
    if (activeFilter.type === 'topic') {
      if (!topicFilters.includes(activeFilter.category)) return { type: 'all' };
      return activeFilter;
    }
    if (!collections.some((c) => c.id === activeFilter.collectionId)) {
      return { type: 'all' };
    }
    return activeFilter;
  }, [activeFilter, collections, topicFilters]);

  const filteredCurrios = useMemo(() => {
    if (resolvedFilter.type === 'all') return savedCurrios;
    if (resolvedFilter.type === 'topic') {
      return savedCurrios.filter((curio) => curio.category === resolvedFilter.category);
    }
    const collection = collections.find((c) => c.id === resolvedFilter.collectionId);
    if (!collection) return savedCurrios;
    const idSet = new Set(collection.curioIds);
    return savedCurrios.filter((curio) => idSet.has(curio.id));
  }, [collections, resolvedFilter, savedCurrios]);

  const activeFilterLabel = useMemo(() => {
    if (resolvedFilter.type === 'all') return 'All saved';
    if (resolvedFilter.type === 'topic') return resolvedFilter.category;
    return (
      collections.find((c) => c.id === resolvedFilter.collectionId)?.name ?? 'Collection'
    );
  }, [resolvedFilter, collections]);

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

      <View style={[styles.mesh, styles.meshOne, { opacity: isDark ? 0.16 : 0.1 }]} />
      <View style={[styles.mesh, styles.meshTwo, { opacity: isDark ? 0.1 : 0.07 }]} />

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
            <Text style={[styles.kicker, { color: palette.kicker }]}>YOUR LIBRARY</Text>
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
              Bookmarks and collections — ready when curiosity strikes.
            </Text>
          </View>

          <BookmarksFilterButton
            active={resolvedFilter}
            activeLabel={activeFilterLabel}
            onPress={() => setFilterOpen(true)}
            isDark={isDark}
          />
        </Animated.View>

        {resolvedFilter.type !== 'all' || sortedCollections.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.chipRow}>
            {resolvedFilter.type !== 'all' ? (
              <Pressable
                onPress={() => setActiveFilter({ type: 'all' })}
                style={[
                  styles.activeChip,
                  {
                    backgroundColor: isDark
                      ? `${BRAND.electric}33`
                      : `${BRAND.electric}14`,
                    borderColor: BRAND.electric,
                  },
                ]}
              >
                <Ionicons
                  name={
                    resolvedFilter.type === 'collection'
                      ? 'folder'
                      : 'funnel'
                  }
                  size={13}
                  color={BRAND.electric}
                />
                <Text style={styles.activeChipText}>{activeFilterLabel}</Text>
                <Ionicons name="close" size={14} color={BRAND.electric} />
              </Pressable>
            ) : null}

            {sortedCollections.slice(0, 3).map((collection) => {
              const selected =
                resolvedFilter.type === 'collection' &&
                resolvedFilter.collectionId === collection.id;
              return (
                <Pressable
                  key={collection.id}
                  onPress={() =>
                    setActiveFilter(
                      selected
                        ? { type: 'all' }
                        : { type: 'collection', collectionId: collection.id },
                    )
                  }
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: selected
                        ? BRAND.electric
                        : isDark
                          ? `${BRAND.deepMuted}CC`
                          : `${BRAND.mint}CC`,
                      borderColor: selected
                        ? BRAND.electric
                        : isDark
                          ? `${BRAND.lavender}28`
                          : `${BRAND.electric}16`,
                    },
                  ]}
                >
                  <Ionicons
                    name="folder-outline"
                    size={12}
                    color={selected ? BRAND.mist : BRAND.electric}
                  />
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: selected ? BRAND.mist : palette.tileTitle },
                    ]}
                    numberOfLines={1}
                  >
                    {collection.name}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}

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
                colors={[BRAND.electric, BRAND.lavender]}
                style={styles.emptyIcon}
              >
                <Ionicons name="bookmark" size={26} color={BRAND.mist} />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: palette.tileTitle }]}>
                Your shelf is empty
              </Text>
              <Text style={[styles.emptyBody, { color: palette.tileSubtitle }]}>
                Save curios from home, then group them into collections from the
                filter button.
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
              <Ionicons name="folder-open-outline" size={28} color={BRAND.electric} />
              <Text style={[styles.emptyTitle, { color: palette.tileTitle }]}>
                Nothing in this view
              </Text>
              <Text style={[styles.emptyBody, { color: palette.tileSubtitle }]}>
                Clear the filter or add more curios to this collection.
              </Text>
              <Pressable
                onPress={() => setActiveFilter({ type: 'all' })}
                style={styles.resetBtn}
                accessibilityRole="button"
              >
                <Text style={styles.resetText}>Show all saved</Text>
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
                onOrganize={() => openSaveSheet(curio.id)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <BookmarksFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        topics={topicFilters}
        counts={topicCounts}
        totalCount={savedCurrios.length}
        active={resolvedFilter}
        onChange={setActiveFilter}
        palette={palette}
      />
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
    paddingBottom: 14,
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
    maxWidth: '96%',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeChipText: {
    color: BRAND.electric,
    fontSize: 12,
    fontWeight: '800',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 140,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
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
