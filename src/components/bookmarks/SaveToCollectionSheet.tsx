import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useCollectionSheetStore } from '@/store/useCollectionSheetStore';
import { BRAND } from '@/theme/brand';
import { sortCollections } from '@/utils/collections';
import { showActionFeedback } from '@/utils/actionFeedback';

/**
 * One collection row: [folder] name · count [check] — always a single horizontal line.
 * Layout lives on an inner View (not Pressable) so Android / Expo Go apply flex correctly.
 */
function CollectionListRow({
  name,
  count,
  selected,
  isDark,
  textColor,
  mutedColor,
  borderColor,
  surfaceColor,
  onPress,
}: {
  name: string;
  count: number;
  selected: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              backgroundColor: pressed
                ? isDark
                  ? `${BRAND.electric}44`
                  : `${BRAND.electric}18`
                : surfaceColor,
              borderColor,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.folderIcon,
              {
                backgroundColor: selected
                  ? BRAND.electric
                  : isDark
                    ? `${BRAND.electric}28`
                    : `${BRAND.electric}12`,
              },
            ]}
          >
            <Ionicons
              name={selected ? 'folder' : 'folder-outline'}
              size={18}
              color={selected ? BRAND.mist : BRAND.electric}
            />
          </View>

          <Text style={[styles.rowTitle, { color: textColor }]} numberOfLines={1}>
            {name}
          </Text>

          <Text style={[styles.rowMeta, { color: mutedColor }]} numberOfLines={1}>
            {count} saved
          </Text>

          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={selected ? BRAND.electric : mutedColor}
          />
        </View>
      )}
    </Pressable>
  );
}

export function SaveToCollectionSheet() {
  const curioId = useCollectionSheetStore((s) => s.saveCurioId);
  const closeSaveSheet = useCollectionSheetStore((s) => s.closeSaveSheet);
  const visible = Boolean(curioId);

  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const collections = useAppStore((s) => s.collections);
  const createCollection = useAppStore((s) => s.createCollection);
  const toggleCurioCollection = useAppStore((s) => s.toggleCurioCollection);

  const [draftName, setDraftName] = useState('');
  const [draftForCurioId, setDraftForCurioId] = useState(curioId);

  if (curioId !== draftForCurioId) {
    setDraftForCurioId(curioId);
    setDraftName('');
  }

  const sorted = useMemo(() => sortCollections(collections), [collections]);

  const handleToggle = async (collectionId: string) => {
    if (!curioId) return;
    void Haptics.selectionAsync();
    await toggleCurioCollection(collectionId, curioId);
  };

  const handleCreate = async () => {
    if (!curioId) return;
    const created = await createCollection(draftName);
    if (!created) {
      showActionFeedback('error', 'Name must be 1–48 characters');
      return;
    }
    setDraftName('');
    await toggleCurioCollection(created.id, curioId);
    showActionFeedback('success', `Saved to “${created.name}”`);
  };

  const handleDone = () => {
    setDraftName('');
    closeSaveSheet();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDone}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDone} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? BRAND.deep : colors.card,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? `${BRAND.mist}44`
                  : `${BRAND.electric}33`,
              },
            ]}
          />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text
                style={[
                  styles.kicker,
                  { color: isDark ? `${BRAND.mist}99` : colors.textSecondary },
                ]}
              >
                ORGANIZE
              </Text>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? BRAND.mist : colors.text },
                ]}
              >
                Add to a collection
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: isDark ? `${BRAND.mist}AA` : colors.textMuted,
                  },
                ]}
              >
                Optional — your currio is already saved. File it into a folder
                anytime.
              </Text>
            </View>
            <Pressable
              onPress={handleDone}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: isDark
                    ? `${BRAND.electric}33`
                    : `${BRAND.electric}14`,
                },
              ]}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.createBox,
              {
                borderColor: isDark
                  ? `${BRAND.lavender}28`
                  : `${BRAND.electric}18`,
                backgroundColor: isDark
                  ? `${BRAND.electric}12`
                  : `${BRAND.electric}06`,
              },
            ]}
          >
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Create new collection"
              placeholderTextColor={
                isDark ? `${BRAND.mist}77` : colors.textMuted
              }
              style={[
                styles.input,
                { color: isDark ? BRAND.mist : colors.text },
              ]}
              maxLength={48}
              returnKeyType="done"
              onSubmitEditing={() => void handleCreate()}
            />
            <Pressable onPress={() => void handleCreate()}>
              <LinearGradient
                colors={[BRAND.electric, BRAND.pale]}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={18} color={BRAND.mist} />
              </LinearGradient>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {sorted.length === 0 ? (
              <Text
                style={[
                  styles.empty,
                  {
                    color: isDark ? `${BRAND.mist}AA` : colors.textMuted,
                  },
                ]}
              >
                No collections yet — create one to group related curios.
              </Text>
            ) : (
              sorted.map((collection) => {
                const selected = curioId
                  ? collection.curioIds.includes(curioId)
                  : false;
                return (
                  <CollectionListRow
                    key={collection.id}
                    name={collection.name}
                    count={collection.curioIds.length}
                    selected={selected}
                    isDark={isDark}
                    textColor={isDark ? BRAND.mist : colors.text}
                    mutedColor={
                      isDark ? `${BRAND.mist}99` : colors.textMuted
                    }
                    borderColor={
                      selected
                        ? BRAND.electric
                        : isDark
                          ? `${BRAND.lavender}28`
                          : colors.border
                    }
                    surfaceColor={
                      selected
                        ? isDark
                          ? `${BRAND.electric}33`
                          : `${BRAND.electric}12`
                        : isDark
                          ? `${BRAND.deepMuted}AA`
                          : colors.card
                    }
                    onPress={() => void handleToggle(collection.id)}
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 0, 24, 0.45)',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  doneText: {
    color: BRAND.electric,
    fontWeight: '800',
    fontSize: 13,
  },
  createBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    paddingLeft: 14,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: 12,
  },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  rowTitle: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  rowMeta: {
    flexGrow: 0,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
});
