import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

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
      onChangeHours(hours.filter((h) => h !== hour));
      return;
    }
    if (hours.length >= MAX_REMINDER_HOURS) return;
    onChangeHours([...hours, hour].sort((a, b) => a - b));
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      entering={FadeIn.delay(delay).duration(300)}
      style={styles.wrap}
    >
      <View
        style={[
          styles.tile,
          {
            backgroundColor: palette.tileBg,
            borderColor: palette.tileBorder,
          },
        ]}
      >
        <LinearGradient
          colors={palette.tileAccent}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.accent}
        />
        <View style={[styles.iconWrap, { backgroundColor: palette.iconWrapBg }]}>
          <Ionicons name="notifications-outline" size={20} color={BRAND.electric} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.tileTitle }]}>
            Learning reminders
          </Text>
          <Text style={[styles.subtitle, { color: palette.tileSubtitle }]}>
            {enabled
              ? formatReminderHoursLabel(hours)
              : 'Off — turn on to stay curious'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: isDark ? `${BRAND.lavender}33` : `${BRAND.electric}22`,
            true: BRAND.electric,
          }}
          thumbColor={BRAND.mist}
          accessibilityLabel="Learning reminders"
        />
      </View>

      {enabled ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={styles.drawer}
        >
          <Text style={[styles.drawerHint, { color: palette.tileSubtitle }]}>
            Pick {MIN_REMINDER_HOURS}–{MAX_REMINDER_HOURS} times. Streak-at-risk nudges at 8pm
            if you haven’t opened Currio yet.
          </Text>
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
                    styles.hourChip,
                    selected
                      ? styles.hourChipSelected
                      : {
                          backgroundColor: isDark
                            ? `${BRAND.electric}14`
                            : `${BRAND.electric}08`,
                          borderColor: isDark
                            ? `${BRAND.lavender}22`
                            : `${BRAND.electric}14`,
                        },
                    lockedOut && styles.hourChipLocked,
                    pressed && styles.hourChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.hourChipText,
                      {
                        color: selected ? BRAND.mist : palette.tileTitle,
                      },
                    ]}
                  >
                    {formatReminderHour(hour)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.freezeNote, { color: palette.tileSubtitle }]}>
            Streak freeze: one missed day protected each week.
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  drawer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  drawerHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  hourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  hourChipSelected: {
    backgroundColor: BRAND.electric,
    borderColor: BRAND.electric,
  },
  hourChipLocked: {
    opacity: 0.4,
  },
  hourChipPressed: {
    opacity: 0.88,
  },
  hourChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  freezeNote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
  },
});
