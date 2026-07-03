import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SavedCurrioCard } from '@/components/profile/SavedCurrioCard';
import { getBookmarkedCurios } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';
import type { ProfilePalette } from '@/hooks/useProfilePalette';

interface LatestSavedCurrioSnapshotProps {
  palette: ProfilePalette;
  delay?: number;
  onViewAll: () => void;
}

export function LatestSavedCurrioSnapshot({
  palette,
  delay = 300,
  onViewAll,
}: LatestSavedCurrioSnapshotProps) {
  const router = useRouter();
  const bookmarkIds = useAppStore((s) => s.bookmarks);

  const latestCurrio = useMemo(() => {
    const saved = getBookmarkedCurios([...bookmarkIds].reverse());
    return saved[0] ?? null;
  }, [bookmarkIds]);

  const openCurrio = (id: string) => {
    router.push(`/currio/${id}` as Href);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
          {'// latest save'}
        </Text>
        {bookmarkIds.length > 0 ? (
          <Pressable onPress={onViewAll} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.viewAll, { color: palette.sectionTag }]}>
              View all ({bookmarkIds.length})
            </Text>
          </Pressable>
        ) : null}
      </View>

      {latestCurrio ? (
        <SavedCurrioCard
          curio={latestCurrio}
          palette={palette}
          onPress={() => openCurrio(latestCurrio.id)}
        />
      ) : (
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <View
            style={[
              styles.empty,
              {
                backgroundColor: palette.tileBg,
                borderColor: palette.tileBorder,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: palette.tileTitle }]}>
              No saved currios yet
            </Text>
            <Text style={[styles.emptyBody, { color: palette.tileSubtitle }]}>
              Bookmark currios from home — they&apos;ll show up here.
            </Text>
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
