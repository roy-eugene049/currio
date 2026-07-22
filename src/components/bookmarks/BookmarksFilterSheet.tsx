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

import { CATEGORY_ICONS } from '@/constants';
import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { BRAND } from '@/theme/brand';
import type { Category, CurioCollection } from '@/types/curio';
import { sortCollections } from '@/utils/collections';
import { showActionFeedback } from '@/utils/actionFeedback';

export type BookmarkFilter =
  | { type: 'all' }
  | { type: 'topic'; category: Category }
  | { type: 'collection'; collectionId: string };

interface BookmarksFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  topics: Category[];
  counts: Partial<Record<Category, number>>;
  totalCount: number;
  active: BookmarkFilter;
  onChange: (filter: BookmarkFilter) => void;
  palette: ProfilePalette;
}

/**
 * Horizontal filter row: [icon] label · count [check]
 * Layout on inner View so Android / Expo Go apply flex correctly.
 */
function FilterRow({
  icon,
  label,
  count,
  selected,
  onPress,
  isDark,
  textColor,
  mutedColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              backgroundColor: pressed
                ? isDark
                  ? `${BRAND.electric}44`
                  : `${BRAND.electric}18`
                : selected
                  ? isDark
                    ? `${BRAND.electric}40`
                    : `${BRAND.electric}14`
                  : isDark
                    ? `${BRAND.deepMuted}CC`
                    : '#FFFFFF',
              borderColor: selected
                ? BRAND.electric
                : isDark
                  ? `${BRAND.lavender}28`
                  : `${BRAND.electric}18`,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor: selected
                  ? BRAND.electric
                  : isDark
                    ? `${BRAND.electric}28`
                    : `${BRAND.lavender}66`,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={16}
              color={selected ? BRAND.mist : BRAND.electric}
            />
          </View>
          <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.rowMeta, { color: mutedColor }]} numberOfLines={1}>
            {count}
          </Text>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={selected ? BRAND.electric : mutedColor}
          />
        </View>
      )}
    </Pressable>
  );
}

/**
 * Collection row: [folder] name · count [check] [rename] [delete] — one horizontal line.
 */
function CollectionFilterRow({
  name,
  count,
  selected,
  isDark,
  textColor,
  mutedColor,
  onSelect,
  onRename,
  onDelete,
}: {
  name: string;
  count: number;
  selected: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: selected
            ? isDark
              ? `${BRAND.electric}40`
              : `${BRAND.electric}14`
            : isDark
              ? `${BRAND.deepMuted}CC`
              : '#FFFFFF',
          borderColor: selected
            ? BRAND.electric
            : isDark
              ? `${BRAND.lavender}28`
              : `${BRAND.electric}18`,
        },
      ]}
    >
      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={styles.collectionMain}
      >
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor: selected
                ? BRAND.electric
                : isDark
                  ? `${BRAND.electric}28`
                  : `${BRAND.lavender}66`,
            },
          ]}
        >
          <Ionicons
            name={selected ? 'folder' : 'folder-outline'}
            size={16}
            color={selected ? BRAND.mist : BRAND.electric}
          />
        </View>
        <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.rowMeta, { color: mutedColor }]} numberOfLines={1}>
          {count} saved
        </Text>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={selected ? BRAND.electric : mutedColor}
        />
      </Pressable>

      <Pressable
        onPress={onRename}
        hitSlop={8}
        accessibilityLabel={`Rename ${name}`}
        style={styles.actionBtn}
      >
        <Ionicons name="pencil-outline" size={16} color={BRAND.electric} />
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityLabel={`Delete ${name}`}
        style={styles.actionBtn}
      >
        <Ionicons
          name="trash-outline"
          size={16}
          color={isDark ? BRAND.pale : mutedColor}
        />
      </Pressable>
    </View>
  );
}

export function BookmarksFilterSheet({
  visible,
  onClose,
  topics,
  counts,
  totalCount,
  active,
  onChange,
  palette,
}: BookmarksFilterSheetProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const collections = useAppStore((s) => s.collections);
  const createCollection = useAppStore((s) => s.createCollection);
  const renameCollection = useAppStore((s) => s.renameCollection);
  const deleteCollection = useAppStore((s) => s.deleteCollection);

  const [draftName, setDraftName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const sortedCollections = useMemo(
    () => sortCollections(collections),
    [collections],
  );

  const select = (filter: BookmarkFilter) => {
    void Haptics.selectionAsync();
    onChange(filter);
    onClose();
  };

  const handleCreate = async () => {
    const created = await createCollection(draftName);
    if (!created) {
      showActionFeedback('error', 'Name must be 1–48 characters');
      return;
    }
    setDraftName('');
    showActionFeedback('success', `Created “${created.name}”`);
    select({ type: 'collection', collectionId: created.id });
  };

  const handleRename = async (collection: CurioCollection) => {
    const ok = await renameCollection(collection.id, renameDraft);
    if (!ok) {
      showActionFeedback('error', 'Name must be 1–48 characters');
      return;
    }
    setRenamingId(null);
    setRenameDraft('');
    showActionFeedback('success', 'Collection renamed');
  };

  const handleDelete = async (collection: CurioCollection) => {
    await deleteCollection(collection.id);
    if (active.type === 'collection' && active.collectionId === collection.id) {
      onChange({ type: 'all' });
    }
    showActionFeedback('success', 'Collection deleted');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
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
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetKicker, { color: palette.kicker }]}>
                BROWSE
              </Text>
              <Text style={[styles.sheetTitle, { color: palette.tileTitle }]}>
                Filter & collections
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? `${BRAND.lavender}18`
                    : `${BRAND.electric}10`,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={palette.tileTitle} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.sectionLabel, { color: palette.tileSubtitle }]}>
              Topics
            </Text>
            <FilterRow
              icon="albums-outline"
              label="All saved"
              count={totalCount}
              selected={active.type === 'all'}
              onPress={() => select({ type: 'all' })}
              isDark={isDark}
              textColor={palette.tileTitle}
              mutedColor={palette.tileSubtitle}
            />
            {topics.map((topic) => (
              <FilterRow
                key={topic}
                icon={CATEGORY_ICONS[topic] as keyof typeof Ionicons.glyphMap}
                label={topic}
                count={counts[topic] ?? 0}
                selected={
                  active.type === 'topic' && active.category === topic
                }
                onPress={() => select({ type: 'topic', category: topic })}
                isDark={isDark}
                textColor={palette.tileTitle}
                mutedColor={palette.tileSubtitle}
              />
            ))}

            <Text
              style={[
                styles.sectionLabel,
                styles.sectionSpaced,
                { color: palette.tileSubtitle },
              ]}
            >
              Collections
            </Text>

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
                placeholder="New collection name"
                placeholderTextColor={palette.tileSubtitle}
                style={[styles.input, { color: palette.tileTitle }]}
                maxLength={48}
                returnKeyType="done"
                onSubmitEditing={() => void handleCreate()}
              />
              <Pressable
                onPress={() => void handleCreate()}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}
              >
                <LinearGradient
                  colors={[BRAND.electric, BRAND.pale]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createBtn}
                >
                  <Ionicons name="add" size={18} color={BRAND.mist} />
                  <Text style={styles.createBtnText}>Create</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {sortedCollections.length === 0 ? (
              <Text style={[styles.emptyHint, { color: palette.tileSubtitle }]}>
                Group saved curios into folders — create one above.
              </Text>
            ) : (
              sortedCollections.map((collection) => {
                const selected =
                  active.type === 'collection' &&
                  active.collectionId === collection.id;
                const isRenaming = renamingId === collection.id;

                if (isRenaming) {
                  return (
                    <View
                      key={collection.id}
                      style={[
                        styles.renameRow,
                        {
                          borderColor: isDark
                            ? `${BRAND.lavender}28`
                            : `${BRAND.electric}18`,
                          backgroundColor: isDark
                            ? `${BRAND.deepMuted}CC`
                            : '#FFFFFF',
                        },
                      ]}
                    >
                      <TextInput
                        value={renameDraft}
                        onChangeText={setRenameDraft}
                        style={[
                          styles.input,
                          { color: palette.tileTitle, flex: 1 },
                        ]}
                        autoFocus
                        maxLength={48}
                        onSubmitEditing={() => void handleRename(collection)}
                      />
                      <Pressable
                        onPress={() => void handleRename(collection)}
                        hitSlop={8}
                      >
                        <Text style={styles.linkAction}>Save</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setRenamingId(null);
                          setRenameDraft('');
                        }}
                        hitSlop={8}
                      >
                        <Text
                          style={[
                            styles.linkAction,
                            { color: palette.tileSubtitle },
                          ]}
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <CollectionFilterRow
                    key={collection.id}
                    name={collection.name}
                    count={collection.curioIds.length}
                    selected={selected}
                    isDark={isDark}
                    textColor={palette.tileTitle}
                    mutedColor={palette.tileSubtitle}
                    onSelect={() =>
                      select({
                        type: 'collection',
                        collectionId: collection.id,
                      })
                    }
                    onRename={() => {
                      setRenamingId(collection.id);
                      setRenameDraft(collection.name);
                    }}
                    onDelete={() => void handleDelete(collection)}
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

/** Compact filter trigger shown in the bookmarks header. */
export function BookmarksFilterButton({
  active,
  activeLabel,
  onPress,
  isDark,
}: {
  active: BookmarkFilter;
  activeLabel: string;
  onPress: () => void;
  isDark: boolean;
}) {
  const isFiltered = active.type !== 'all';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter saved curios. Current: ${activeLabel}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <LinearGradient
        colors={
          isFiltered
            ? [BRAND.electric, BRAND.pale]
            : isDark
              ? [`${BRAND.deepMuted}`, `${BRAND.electric}66`]
              : [`${BRAND.electric}22`, `${BRAND.mint}`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.filterBtn}
      >
        <Ionicons
          name="options-outline"
          size={18}
          color={isFiltered || isDark ? BRAND.mist : BRAND.electric}
        />
        {isFiltered ? (
          <View style={styles.filterDot}>
            <View style={styles.filterDotInner} />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 0, 24, 0.45)',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sheetKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSpaced: {
    marginTop: 18,
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
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    marginRight: 12,
  },
  rowLabel: {
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
  collectionMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    minWidth: 0,
    marginRight: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  createBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    color: BRAND.mist,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 56,
  },
  linkAction: {
    color: BRAND.electric,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.lavender,
  },
});
