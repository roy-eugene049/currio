import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ReminderTimeSheet } from '@/components/profile/ReminderTimeSheet';
import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import {
  formatNextNudgeLabel,
  formatReminderTime,
  formatReminderTimesLabel,
  MAX_REMINDER_TIMES,
  MIN_REMINDER_TIMES,
  nextOccurrenceDate,
  openExactAlarmSettings,
  reminderTimeKey,
  scheduleTestNudge,
  type ReminderTime,
} from '@/services/reminderService';
import { BRAND } from '@/theme/brand';

interface LearningRemindersTileProps {
  enabled: boolean;
  times: ReminderTime[];
  onToggle: (value: boolean) => void;
  onChangeTimes: (times: ReminderTime[]) => void;
  palette: ProfilePalette;
  delay?: number;
}

type PickerMode =
  | { kind: 'add'; initial: ReminderTime }
  | { kind: 'edit'; index: number; initial: ReminderTime }
  | null;

/**
 * Horizontal row: [icon] time · period [chevron]
 * Layout lives on an inner View (not Pressable) so Android / Expo Go apply flex correctly.
 */
function TimeListRow({
  time,
  period,
  onPress,
  isDark,
  textColor,
  mutedColor,
}: {
  time: ReminderTime;
  period: string;
  onPress: () => void;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit nudge at ${formatReminderTime(time)}`}
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
                : isDark
                  ? `${BRAND.deepMuted}CC`
                  : '#FFFFFF',
              borderColor: isDark
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
                backgroundColor: isDark
                  ? `${BRAND.electric}28`
                  : `${BRAND.lavender}66`,
              },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={BRAND.electric} />
          </View>

          <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
            {formatReminderTime(time)}
          </Text>

          <Text style={[styles.rowMeta, { color: mutedColor }]} numberOfLines={1}>
            {period}
          </Text>

          <Ionicons name="chevron-forward" size={18} color={mutedColor} />
        </View>
      )}
    </Pressable>
  );
}

function periodForTime(time: ReminderTime): string {
  const minutes = time.hour * 60 + time.minute;
  if (minutes < 12 * 60) return 'Morning';
  if (minutes < 17 * 60) return 'Afternoon';
  if (minutes < 21 * 60) return 'Evening';
  return 'Night';
}

function suggestedAddTime(existing: ReminderTime[]): ReminderTime {
  const taken = new Set(existing.map(reminderTimeKey));
  const candidates: ReminderTime[] = [
    { hour: 9, minute: 0 },
    { hour: 12, minute: 30 },
    { hour: 15, minute: 0 },
    { hour: 18, minute: 30 },
    { hour: 21, minute: 0 },
  ];
  for (const candidate of candidates) {
    if (!taken.has(reminderTimeKey(candidate))) return candidate;
  }
  const now = new Date();
  let minute = Math.round(now.getMinutes() / 5) * 5;
  let hour = now.getHours();
  if (minute >= 60) {
    minute = 0;
    hour = (hour + 1) % 24;
  }
  return { hour, minute };
}

export function LearningRemindersTile({
  enabled,
  times,
  onToggle,
  onChangeTimes,
  palette,
  delay = 320,
}: LearningRemindersTileProps) {
  const { isDark } = useTheme();
  const [picker, setPicker] = useState<PickerMode>(null);
  const [testing, setTesting] = useState(false);
  const [testHint, setTestHint] = useState<string | null>(null);

  const sortedTimes = useMemo(
    () =>
      [...times].sort(
        (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
      ),
    [times],
  );

  const nextNudgeLabel = useMemo(() => {
    if (sortedTimes.length === 0) return null;
    const upcoming = [...sortedTimes]
      .map((time) => ({ time, at: nextOccurrenceDate(time).getTime() }))
      .sort((a, b) => a.at - b.at)[0];
    return upcoming ? formatNextNudgeLabel(upcoming.time) : null;
  }, [sortedTimes]);

  const canAdd = times.length < MAX_REMINDER_TIMES;
  const canRemove = times.length > MIN_REMINDER_TIMES;

  const openAddPicker = () => {
    if (!canAdd) return;
    void Haptics.selectionAsync();
    setPicker({ kind: 'add', initial: suggestedAddTime(times) });
  };

  const openEditPicker = (index: number) => {
    const time = sortedTimes[index];
    if (!time) return;
    void Haptics.selectionAsync();
    setPicker({ kind: 'edit', index, initial: time });
  };

  const closePicker = () => setPicker(null);

  const commitDraft = (nextTime: ReminderTime) => {
    const key = reminderTimeKey(nextTime);

    if (picker?.kind === 'add') {
      if (!times.some((t) => reminderTimeKey(t) === key)) {
        onChangeTimes([...times, nextTime]);
      }
      closePicker();
      return;
    }

    if (picker?.kind === 'edit') {
      const current = sortedTimes[picker.index];
      if (!current) {
        closePicker();
        return;
      }
      const withoutCurrent = times.filter(
        (t) => reminderTimeKey(t) !== reminderTimeKey(current),
      );
      if (!withoutCurrent.some((t) => reminderTimeKey(t) === key)) {
        onChangeTimes([...withoutCurrent, nextTime]);
      }
      closePicker();
    }
  };

  const removeEditingTime = () => {
    if (picker?.kind !== 'edit' || !canRemove) return;
    const current = sortedTimes[picker.index];
    if (!current) return;
    void Haptics.selectionAsync();
    onChangeTimes(
      times.filter((t) => reminderTimeKey(t) !== reminderTimeKey(current)),
    );
    closePicker();
  };

  const handleTestNudge = async () => {
    if (testing) return;
    setTesting(true);
    setTestHint(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const ok = await scheduleTestNudge(8);
      setTestHint(
        ok
          ? 'Test nudge in ~8 seconds — leave the app briefly to see it.'
          : 'Notifications are blocked. Open Settings to allow them.',
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Animated.View
        entering={FadeIn.delay(delay).duration(360)}
        style={styles.wrap}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.tileBg,
              borderColor: enabled
                ? isDark
                  ? `${BRAND.lavender}44`
                  : `${BRAND.electric}30`
                : palette.tileBorder,
            },
          ]}
        >
          <LinearGradient
            colors={
              enabled
                ? [BRAND.deep, BRAND.electric, BRAND.pale]
                : [BRAND.deepMuted, BRAND.electric]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBand, !enabled && styles.heroBandPaused]}
          >
            <View style={styles.heroOrb} />
            <View style={styles.heroRow}>
              <View style={styles.heroIconDisc}>
                <Ionicons name="notifications" size={22} color={BRAND.mist} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroKicker}>HABIT</Text>
                <Text style={styles.heroTitle}>Curiosity nudges</Text>
                <Text style={styles.heroSubtitle}>
                  Pick any times — we’ll gently pull you back for one fresh
                  currio.
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(value) => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggle(value);
                }}
                trackColor={{
                  false: `${BRAND.mist}55`,
                  true: `${BRAND.mist}DD`,
                }}
                thumbColor={enabled ? BRAND.mist : `${BRAND.mist}EE`}
                accessibilityLabel="Curiosity nudges"
              />
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: enabled
                      ? isDark
                        ? `${BRAND.electric}33`
                        : `${BRAND.electric}14`
                      : isDark
                        ? `${BRAND.lavender}14`
                        : `${BRAND.electric}08`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: enabled
                        ? '#34D399'
                        : palette.tileSubtitle,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: palette.tileTitle }]}>
                  {enabled ? 'On' : 'Off'}
                </Text>
              </View>
              <Text
                style={[styles.scheduleHint, { color: palette.tileSubtitle }]}
              >
                {enabled
                  ? formatReminderTimesLabel(sortedTimes)
                  : 'Turn on to schedule nudges'}
              </Text>
            </View>

            {enabled ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(140)}
                style={styles.scheduleBlock}
              >
                <View
                  style={[
                    styles.timesCard,
                    {
                      backgroundColor: isDark
                        ? `${BRAND.electric}12`
                        : `${BRAND.electric}07`,
                      borderColor: isDark
                        ? `${BRAND.lavender}22`
                        : `${BRAND.electric}14`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timesEyebrow,
                      { color: palette.tileSubtitle },
                    ]}
                  >
                    Your times · {sortedTimes.length}/{MAX_REMINDER_TIMES}
                  </Text>
                  <Text
                    style={[
                      styles.timesCaption,
                      { color: palette.tileSubtitle },
                    ]}
                  >
                    Daily nudges plus an 8:00 pm streak watch if you haven’t
                    opened Currio yet.
                  </Text>

                  {nextNudgeLabel ? (
                    <Text
                      style={[styles.nextNudge, { color: BRAND.electric }]}
                    >
                      {nextNudgeLabel}
                    </Text>
                  ) : null}

                  <View style={styles.timeList}>
                    {sortedTimes.map((time, index) => (
                      <TimeListRow
                        key={reminderTimeKey(time)}
                        time={time}
                        period={periodForTime(time)}
                        onPress={() => openEditPicker(index)}
                        isDark={isDark}
                        textColor={palette.tileTitle}
                        mutedColor={palette.tileSubtitle}
                      />
                    ))}
                  </View>

                  {canAdd ? (
                    <Pressable
                      onPress={openAddPicker}
                      accessibilityRole="button"
                      accessibilityLabel="Add nudge time"
                    >
                      {({ pressed }) => (
                        <View
                          style={[
                            styles.addRow,
                            {
                              borderColor: isDark
                                ? `${BRAND.lavender}40`
                                : `${BRAND.electric}28`,
                              backgroundColor: pressed
                                ? isDark
                                  ? `${BRAND.electric}28`
                                  : `${BRAND.electric}12`
                                : isDark
                                  ? `${BRAND.lavender}10`
                                  : '#FFFFFF',
                              opacity: pressed ? 0.92 : 1,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.rowIcon,
                              {
                                backgroundColor: isDark
                                  ? `${BRAND.electric}33`
                                  : `${BRAND.electric}14`,
                              },
                            ]}
                          >
                            <Ionicons
                              name="add"
                              size={18}
                              color={BRAND.electric}
                            />
                          </View>
                          <Text
                            style={[
                              styles.addRowLabel,
                              { color: BRAND.electric },
                            ]}
                            numberOfLines={1}
                          >
                            Add a time
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ) : (
                    <Text
                      style={[styles.limitHint, { color: palette.tileSubtitle }]}
                    >
                      Maximum of {MAX_REMINDER_TIMES} times set.
                    </Text>
                  )}
                </View>

                <View style={styles.footerActions}>
                  <Pressable
                    onPress={() => void handleTestNudge()}
                    disabled={testing}
                    accessibilityRole="button"
                    accessibilityLabel="Send a test nudge"
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.testBtn,
                          {
                            backgroundColor: isDark
                              ? `${BRAND.electric}22`
                              : `${BRAND.electric}12`,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                      >
                        {testing ? (
                          <ActivityIndicator
                            size="small"
                            color={BRAND.electric}
                          />
                        ) : (
                          <Ionicons
                            name="flash-outline"
                            size={15}
                            color={BRAND.electric}
                          />
                        )}
                        <Text
                          style={[
                            styles.testBtnLabel,
                            { color: BRAND.electric },
                          ]}
                        >
                          Send test nudge
                        </Text>
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      void (Platform.OS === 'android'
                        ? openExactAlarmSettings()
                        : Linking.openSettings())
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      Platform.OS === 'android'
                        ? 'Allow exact alarms for nudges'
                        : 'Open notification settings'
                    }
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.settingsLinkLabel,
                          {
                            color: palette.tileSubtitle,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        {Platform.OS === 'android'
                          ? 'Allow exact alarms'
                          : 'Notification settings'}
                      </Text>
                    )}
                  </Pressable>
                </View>

                {testHint ? (
                  <Text
                    style={[styles.testHint, { color: palette.tileSubtitle }]}
                  >
                    {testHint}
                  </Text>
                ) : null}
              </Animated.View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <ReminderTimeSheet
        visible={picker != null}
        mode={picker?.kind === 'edit' ? 'edit' : 'add'}
        initialTime={picker?.initial ?? { hour: 9, minute: 0 }}
        canRemove={canRemove}
        onClose={closePicker}
        onSave={commitDraft}
        onRemove={removeEditingTime}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroBand: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBandPaused: {
    opacity: 0.92,
  },
  heroOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${BRAND.mist}18`,
    top: -36,
    right: -20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconDisc: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${BRAND.mist}28`,
    borderWidth: 1,
    borderColor: `${BRAND.mist}40`,
  },
  heroCopy: {
    flex: 1,
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: `${BRAND.mist}CC`,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: `${BRAND.mist}E6`,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleHint: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  scheduleBlock: {
    marginTop: 2,
    gap: 12,
  },
  timesCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  timesEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  timesCaption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  nextNudge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  timeList: {
    gap: 8,
    width: '100%',
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
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexGrow: 0,
    flexShrink: 0,
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
    marginRight: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addRowLabel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 14,
    fontWeight: '800',
  },
  limitHint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  testBtnLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingsLinkLabel: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  testHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
