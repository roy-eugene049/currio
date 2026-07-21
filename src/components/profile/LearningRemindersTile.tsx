import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import {
  formatReminderHour,
  formatReminderHoursLabel,
  MAX_REMINDER_HOURS,
  MIN_REMINDER_HOURS,
  REMINDER_HOUR_OPTIONS,
} from '@/services/reminderService';
import { BRAND } from '@/theme/brand';

interface LearningRemindersTileProps {
  enabled: boolean;
  hours: number[];
  onToggle: (value: boolean) => void;
  onChangeHours: (hours: number[]) => void;
  palette: ProfilePalette;
  delay?: number;
}

function PerkChip({
  icon,
  label,
  palette,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  palette: ProfilePalette;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.perk,
        {
          backgroundColor: isDark ? `${BRAND.electric}18` : `${BRAND.electric}0A`,
          borderColor: isDark ? `${BRAND.lavender}28` : `${BRAND.electric}16`,
        },
      ]}
    >
      <Ionicons name={icon} size={13} color={BRAND.electric} />
      <Text style={[styles.perkLabel, { color: palette.tileTitle }]}>{label}</Text>
    </View>
  );
}

export function LearningRemindersTile({
  enabled,
  hours,
  onToggle,
  onChangeHours,
  palette,
  delay = 320,
}: LearningRemindersTileProps) {
  const { isDark } = useTheme();

  const toggleHour = (hour: number) => {
    const selected = hours.includes(hour);
    if (selected) {
      if (hours.length <= MIN_REMINDER_HOURS) return;
      void Haptics.selectionAsync();
      onChangeHours(hours.filter((h) => h !== hour));
      return;
    }
    if (hours.length >= MAX_REMINDER_HOURS) return;
    void Haptics.selectionAsync();
    onChangeHours([...hours, hour].sort((a, b) => a - b));
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
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
              ? [BRAND.electric, BRAND.pale, BRAND.lavender]
              : palette.tileAccent
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBand}
        >
          <View style={styles.heroOrb} />
          <View style={styles.heroRow}>
            <View style={styles.heroIconDisc}>
              <Ionicons name="sparkles" size={22} color={BRAND.mist} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>HABIT</Text>
              <Text style={styles.heroTitle}>Curiosity nudges</Text>
              <Text style={styles.heroSubtitle}>
                Short prompts that pull you back to one fresh currio.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(value) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(value);
              }}
              trackColor={{
                false: `${BRAND.mist}44`,
                true: `${BRAND.mist}CC`,
              }}
              thumbColor={enabled ? BRAND.electric : BRAND.mist}
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
                  { backgroundColor: enabled ? '#34D399' : palette.tileSubtitle },
                ]}
              />
              <Text style={[styles.statusText, { color: palette.tileTitle }]}>
                {enabled ? 'Active' : 'Paused'}
              </Text>
            </View>
            <Text style={[styles.scheduleHint, { color: palette.tileSubtitle }]}>
              {enabled
                ? formatReminderHoursLabel(hours)
                : 'Turn on to set your rhythm'}
            </Text>
          </View>

          <View style={styles.perkRow}>
            <PerkChip
              icon="flame-outline"
              label="Streak watch"
              palette={palette}
              isDark={isDark}
            />
            <PerkChip
              icon="snow-outline"
              label="1 freeze / week"
              palette={palette}
              isDark={isDark}
            />
            <PerkChip
              icon="time-outline"
              label={`${MIN_REMINDER_HOURS}–${MAX_REMINDER_HOURS} times`}
              palette={palette}
              isDark={isDark}
            />
          </View>

          {enabled ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(140)}
              style={styles.scheduleBlock}
            >
              <Text style={[styles.scheduleTitle, { color: palette.tileTitle }]}>
                Your day
              </Text>
              <Text style={[styles.scheduleCaption, { color: palette.tileSubtitle }]}>
                Choose {MIN_REMINDER_HOURS}–{MAX_REMINDER_HOURS} moments. We’ll nudge at
                8pm if today’s streak still needs a check-in.
              </Text>

              <View style={styles.timelineTrack}>
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: isDark
                        ? `${BRAND.lavender}28`
                        : `${BRAND.electric}18`,
                    },
                  ]}
                />
                <View style={styles.hourRow}>
                  {REMINDER_HOUR_OPTIONS.map((hour) => {
                    const selected = hours.includes(hour);
                    const lockedOut =
                      !selected && hours.length >= MAX_REMINDER_HOURS;
                    return (
                      <Pressable
                        key={hour}
                        onPress={() => toggleHour(hour)}
                        disabled={lockedOut}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: lockedOut }}
                        style={({ pressed }) => [
                          styles.hourNode,
                          lockedOut && styles.hourNodeLocked,
                          pressed && styles.hourNodePressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.hourDot,
                            selected
                              ? styles.hourDotSelected
                              : {
                                  backgroundColor: isDark
                                    ? `${BRAND.deepMuted}`
                                    : `${BRAND.mint}`,
                                  borderColor: isDark
                                    ? `${BRAND.lavender}44`
                                    : `${BRAND.electric}28`,
                                },
                          ]}
                        />
                        <Text
                          style={[
                            styles.hourLabel,
                            {
                              color: selected
                                ? BRAND.electric
                                : palette.tileSubtitle,
                              fontWeight: selected ? '800' : '600',
                            },
                          ]}
                        >
                          {formatReminderHour(hour)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Animated.View>
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
  heroOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${BRAND.mist}22`,
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
    borderColor: `${BRAND.mist}33`,
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
    lineHeight: 16,
    color: `${BRAND.mist}DD`,
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
  perkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  perkLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleBlock: {
    marginTop: 2,
    gap: 8,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scheduleCaption: {
    fontSize: 12,
    lineHeight: 17,
  },
  timelineTrack: {
    marginTop: 6,
    paddingTop: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 18,
    height: 2,
    borderRadius: 1,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourNode: {
    alignItems: 'center',
    gap: 8,
    minWidth: 34,
  },
  hourNodeLocked: {
    opacity: 0.35,
  },
  hourNodePressed: {
    opacity: 0.85,
  },
  hourDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  hourDotSelected: {
    backgroundColor: BRAND.electric,
    borderColor: BRAND.lavender,
    shadowColor: BRAND.electric,
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  hourLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
