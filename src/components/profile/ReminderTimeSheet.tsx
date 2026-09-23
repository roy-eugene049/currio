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
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import {
  formatReminderTime,
  type ReminderTime,
} from '@/services/reminderService';
import { BRAND } from '@/theme/brand';

type Period = 'am' | 'pm';

type DraftClock = {
  hour12: number;
  minute: number;
  period: Period;
};

const MINUTE_STEP = 5;
const MINUTES = Array.from({ length: 12 }, (_, i) => i * MINUTE_STEP);

const QUICK_PRESETS: { label: string; time: ReminderTime }[] = [
  { label: 'Morning', time: { hour: 9, minute: 0 } },
  { label: 'Midday', time: { hour: 12, minute: 30 } },
  { label: 'Afternoon', time: { hour: 15, minute: 0 } },
  { label: 'Evening', time: { hour: 18, minute: 30 } },
  { label: 'Night', time: { hour: 21, minute: 0 } },
];

function snapMinute(minute: number): number {
  const snapped = Math.round(minute / MINUTE_STEP) * MINUTE_STEP;
  if (snapped >= 60) return 0;
  return Math.max(0, snapped);
}

function toDraft(time: ReminderTime): DraftClock {
  const period: Period = time.hour >= 12 ? 'pm' : 'am';
  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
  return {
    hour12,
    minute: snapMinute(time.minute),
    period,
  };
}

function fromDraft(draft: DraftClock): ReminderTime {
  let hour = draft.hour12 % 12;
  if (draft.period === 'pm') hour += 12;
  return { hour, minute: snapMinute(draft.minute) };
}

function periodLabel(time: ReminderTime): string {
  const minutes = time.hour * 60 + time.minute;
  if (minutes < 12 * 60) return 'Morning';
  if (minutes < 17 * 60) return 'Afternoon';
  if (minutes < 21 * 60) return 'Evening';
  return 'Night';
}

function StepperColumn({
  label,
  value,
  display,
  onIncrement,
  onDecrement,
  isDark,
}: {
  label: string;
  value: string;
  display?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  isDark: boolean;
}) {
  return (
    <View style={styles.stepperCol}>
      <Text
        style={[
          styles.stepperLabel,
          { color: isDark ? `${BRAND.mist}99` : BRAND.deepMuted },
        ]}
      >
        {label}
      </Text>

      <Pressable
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        hitSlop={6}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.stepBtn,
              {
                backgroundColor: isDark
                  ? `${BRAND.electric}33`
                  : `${BRAND.electric}12`,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-up" size={20} color={BRAND.electric} />
          </View>
        )}
      </Pressable>

      <View
        style={[
          styles.stepValueWell,
          {
            backgroundColor: isDark ? `${BRAND.mist}10` : '#FFFFFF',
            borderColor: isDark ? `${BRAND.lavender}33` : `${BRAND.electric}18`,
          },
        ]}
      >
        <Animated.Text
          key={`${label}-${value}`}
          entering={FadeIn.duration(140)}
          style={[
            styles.stepValue,
            { color: isDark ? BRAND.mist : BRAND.deep },
          ]}
        >
          {display ?? value}
        </Animated.Text>
      </View>

      <Pressable
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        hitSlop={6}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.stepBtn,
              {
                backgroundColor: isDark
                  ? `${BRAND.electric}33`
                  : `${BRAND.electric}12`,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-down" size={20} color={BRAND.electric} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

export type ReminderTimeSheetProps = {
  visible: boolean;
  mode: 'add' | 'edit';
  initialTime: ReminderTime;
  canRemove: boolean;
  onClose: () => void;
  onSave: (time: ReminderTime) => void;
  onRemove?: () => void;
};

export function ReminderTimeSheet({
  visible,
  mode,
  initialTime,
  canRemove,
  onClose,
  onSave,
  onRemove,
}: ReminderTimeSheetProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DraftClock>(() => toDraft(initialTime));
  const openKey = visible
    ? `${initialTime.hour}:${initialTime.minute}`
    : null;
  const [syncedOpenKey, setSyncedOpenKey] = useState(openKey);

  if (openKey !== syncedOpenKey) {
    setSyncedOpenKey(openKey);
    if (openKey) {
      setDraft(toDraft(initialTime));
    }
  }

  const selected = useMemo(() => fromDraft(draft), [draft]);
  const selectedLabel = formatReminderTime(selected);

  const bumpHour = (delta: number) => {
    void Haptics.selectionAsync();
    setDraft((prev) => {
      const current = ((prev.hour12 - 1 + delta) % 12 + 12) % 12;
      return { ...prev, hour12: current + 1 };
    });
  };

  const bumpMinute = (delta: number) => {
    void Haptics.selectionAsync();
    setDraft((prev) => {
      const idx = MINUTES.indexOf(snapMinute(prev.minute));
      const safeIdx = idx < 0 ? 0 : idx;
      const nextIndex = (safeIdx + delta + MINUTES.length) % MINUTES.length;
      return { ...prev, minute: MINUTES[nextIndex]! };
    });
  };

  const setPeriod = (period: Period) => {
    if (draft.period === period) return;
    void Haptics.selectionAsync();
    setDraft((prev) => ({ ...prev, period }));
  };

  const applyPreset = (time: ReminderTime) => {
    void Haptics.selectionAsync();
    setDraft(toDraft(time));
  };

  const handleSave = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(180)}
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? BRAND.deep : colors.card,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
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
                  {
                    color: isDark ? `${BRAND.mist}99` : colors.textSecondary,
                  },
                ]}
              >
                DAILY NUDGE
              </Text>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? BRAND.mist : colors.text },
                ]}
              >
                {mode === 'edit' ? 'Edit time' : 'Pick a time'}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: isDark ? `${BRAND.mist}AA` : colors.textMuted,
                  },
                ]}
              >
                Currio will nudge you at this time every day.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: isDark
                        ? `${BRAND.mist}14`
                        : `${BRAND.electric}10`,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? BRAND.mist : BRAND.electric}
                  />
                </View>
              )}
            </Pressable>
          </View>

          <LinearGradient
            colors={
              isDark
                ? [BRAND.deepMuted, BRAND.electric, BRAND.pale]
                : [BRAND.deep, BRAND.electric, BRAND.pale]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOrb} />
            <Text style={styles.heroEyebrow}>{periodLabel(selected)}</Text>
            <Text style={styles.heroTime}>{selectedLabel}</Text>
            <Text style={styles.heroHint}>every day</Text>
          </LinearGradient>

          <View
            style={[
              styles.periodTrack,
              {
                backgroundColor: isDark
                  ? `${BRAND.mist}10`
                  : `${BRAND.electric}0A`,
                borderColor: isDark
                  ? `${BRAND.lavender}22`
                  : `${BRAND.electric}14`,
              },
            ]}
          >
            {(['am', 'pm'] as const).map((period) => {
              const active = draft.period === period;
              return (
                <View key={period} style={styles.periodSlot}>
                  <Pressable
                    onPress={() => setPeriod(period)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.periodChip,
                          pressed && !active && { opacity: 0.85 },
                        ]}
                      >
                        {active ? (
                          <LinearGradient
                            colors={[BRAND.deep, BRAND.electric]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.periodChipFill}
                          >
                            <Text style={styles.periodChipLabelActive}>
                              {period.toUpperCase()}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <Text
                            style={[
                              styles.periodChipLabel,
                              {
                                color: isDark
                                  ? `${BRAND.mist}BB`
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {period.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.stepperRow}>
            <StepperColumn
              label="Hour"
              value={String(draft.hour12)}
              display={String(draft.hour12)}
              onIncrement={() => bumpHour(1)}
              onDecrement={() => bumpHour(-1)}
              isDark={isDark}
            />

            <Text
              style={[
                styles.colon,
                { color: isDark ? BRAND.lavender : BRAND.electric },
              ]}
            >
              :
            </Text>

            <StepperColumn
              label="Minute"
              value={String(draft.minute)}
              display={String(draft.minute).padStart(2, '0')}
              onIncrement={() => bumpMinute(1)}
              onDecrement={() => bumpMinute(-1)}
              isDark={isDark}
            />
          </View>

          <View style={styles.chipSection}>
            <Text
              style={[
                styles.chipSectionLabel,
                {
                  color: isDark ? `${BRAND.mist}99` : colors.textSecondary,
                },
              ]}
            >
              Quick picks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {QUICK_PRESETS.map((preset) => {
                const active =
                  selected.hour === preset.time.hour &&
                  selected.minute === preset.time.minute;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => applyPreset(preset.time)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: active
                              ? isDark
                                ? `${BRAND.electric}44`
                                : `${BRAND.electric}16`
                              : isDark
                                ? `${BRAND.mist}10`
                                : `${BRAND.mint}`,
                            borderColor: active
                              ? BRAND.electric
                              : isDark
                                ? `${BRAND.lavender}28`
                                : `${BRAND.electric}18`,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetChipTitle,
                            {
                              color: active
                                ? isDark
                                  ? BRAND.mist
                                  : BRAND.electric
                                : isDark
                                  ? BRAND.mist
                                  : BRAND.deep,
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>
                        <Text
                          style={[
                            styles.presetChipMeta,
                            {
                              color: isDark
                                ? `${BRAND.mist}99`
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {formatReminderTime(preset.time)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <View style={styles.secondaryWrap}>
              <Pressable onPress={onClose} accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    style={[
                      styles.secondaryBtn,
                      {
                        borderColor: isDark
                          ? `${BRAND.mist}28`
                          : `${BRAND.electric}22`,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryLabel,
                        {
                          color: isDark
                            ? `${BRAND.mist}CC`
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      Cancel
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.primaryWrap}>
              <Pressable onPress={handleSave} accessibilityRole="button">
                {({ pressed }) => (
                  <View style={{ opacity: pressed ? 0.9 : 1 }}>
                    <LinearGradient
                      colors={[BRAND.deep, BRAND.electric]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryBtn}
                    >
                      <View style={styles.primaryInner}>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={BRAND.mist}
                        />
                        <Text style={styles.primaryLabel}>
                          {mode === 'edit' ? 'Save time' : 'Add time'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {mode === 'edit' && canRemove && onRemove ? (
            <Pressable
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove this nudge time"
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.removeLink,
                    {
                      color: isDark ? '#FCA5A5' : '#DC2626',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  Remove this time
                </Text>
              )}
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 0, 24, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${BRAND.mist}16`,
    top: -48,
    right: -28,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: `${BRAND.mist}CC`,
    textTransform: 'uppercase',
  },
  heroTime: {
    marginTop: 6,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: BRAND.mist,
  },
  heroHint: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: `${BRAND.mist}CC`,
  },
  periodTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  periodSlot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  periodChip: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipFill: {
    width: '100%',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  periodChipLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingVertical: 11,
  },
  periodChipLabelActive: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BRAND.mist,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  stepperCol: {
    alignItems: 'center',
    gap: 8,
    width: 108,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepBtn: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueWell: {
    width: 88,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: 18,
  },
  chipSection: {
    gap: 8,
  },
  chipSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  presetChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 92,
  },
  presetChipTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  presetChipMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 2,
  },
  secondaryWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  primaryWrap: {
    flexGrow: 1.35,
    flexShrink: 1,
    flexBasis: 0,
  },
  secondaryBtn: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
  },
  primaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.mist,
  },
  removeLink: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 2,
  },
});
