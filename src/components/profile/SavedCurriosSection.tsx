import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SavedCurrioCard } from '@/components/profile/SavedCurrioCard';
import { getBookmarkedCurios } from '@/services/curioService';
import { useAppStore } from '@/store/useAppStore';

type SavedSectionPalette = {
  sectionTag: string;
  tileBg: string;
  tileBorder: string;
  tileTitle: string;
  tileSubtitle: string;
  tileAccent: [string, string];
  emptyTitle: string;
  emptyBody: string;
};

interface SavedCurriosSectionProps {
  palette: SavedSectionPalette;
  delay?: number;
}

export function SavedCurriosSection({ palette, delay = 300 }: SavedCurriosSectionProps) {
  const router = useRouter();
  const bookmarkIds = useAppStore((s) => s.bookmarks);

  const savedCurrios = useMemo(
    () => getBookmarkedCurios([...bookmarkIds].reverse()),
    [bookmarkIds],
  );

  const openCurrio = (id: string) => {
    router.push(`/currio/${id}` as Href);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
        {'// saved'}
      </Text>

      {savedCurrios.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              backgroundColor: palette.tileBg,
              borderColor: palette.tileBorder,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: palette.emptyTitle }]}>
            No saved currios yet
          </Text>
          <Text style={[styles.emptyBody, { color: palette.emptyBody }]}>
            Tap the bookmark icon on any currio to save it here for later.
          </Text>
        </View>
      ) : (
        savedCurrios.map((curio) => (
          <SavedCurrioCard
            key={curio.id}
            curio={curio}
            palette={palette}
            onPress={() => openCurrio(curio.id)}
          />
        ))
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
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
