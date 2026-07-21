import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getTodayDateString } from '@/utils/date';

/** Hours users can pick from (local time). */
export const REMINDER_HOUR_OPTIONS = [8, 9, 12, 13, 17, 18, 20, 21] as const;

export const DEFAULT_REMINDER_HOURS = [9, 13, 21] as const;

export const MIN_REMINDER_HOURS = 2;
export const MAX_REMINDER_HOURS = 3;

/** Evening nudge if they haven’t opened Currio yet today. */
export const STREAK_AT_RISK_HOUR = 20;

const CHANNEL_ID = 'learning-reminders';
const REMINDER_PREFIX = 'currio-learn-reminder-';
const STREAK_RISK_ID = 'currio-streak-at-risk';

const REMINDER_COPY = [
  {
    title: 'Time for a currio',
    body: 'Open Currio and learn something new in under a minute.',
  },
  {
    title: 'Keep your streak going',
    body: 'A quick currio is waiting — open the app and keep learning.',
  },
  {
    title: 'Curiosity break',
    body: 'Step away for a moment and discover today’s next fact.',
  },
  {
    title: 'Learn something new',
    body: 'Your next currio is ready whenever you are.',
  },
] as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function supportsLocalNotifications() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function formatReminderHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${suffix}`;
}

export function formatReminderHoursLabel(hours: number[]): string {
  if (hours.length === 0) return 'No times selected';
  return [...hours].sort((a, b) => a - b).map(formatReminderHour).join(' · ');
}

export function normalizeReminderHours(hours: number[]): number[] {
  const unique = [...new Set(hours)]
    .filter((hour) => REMINDER_HOUR_OPTIONS.includes(hour as (typeof REMINDER_HOUR_OPTIONS)[number]))
    .sort((a, b) => a - b);

  if (unique.length >= MIN_REMINDER_HOURS) {
    return unique.slice(0, MAX_REMINDER_HOURS);
  }

  return [...DEFAULT_REMINDER_HOURS];
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Learning reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lightColor: '#6F00FF',
  });
}

export async function requestLearningReminderPermission(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelLearningReminders(): Promise<void> {
  if (!supportsLocalNotifications()) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) =>
          item.identifier.startsWith(REMINDER_PREFIX) ||
          item.identifier === STREAK_RISK_ID,
      )
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

async function scheduleDailyHourReminders(hours: number[]): Promise<void> {
  const normalized = normalizeReminderHours(hours);

  await Promise.all(
    normalized.map((hour, index) => {
      const copy = REMINDER_COPY[index % REMINDER_COPY.length];
      return Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${hour}`,
        content: {
          title: copy.title,
          body: copy.body,
          data: { type: 'learning_reminder', hour },
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
        },
      });
    }),
  );
}

function nextStreakRiskDate(lastOpenDate: string | null): Date {
  const now = new Date();
  const today = getTodayDateString();
  const target = new Date(now);
  target.setHours(STREAK_AT_RISK_HOUR, 0, 0, 0);

  const openedToday = Boolean(lastOpenDate && lastOpenDate === today);

  if (openedToday || now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

async function scheduleStreakAtRisk(lastOpenDate: string | null): Promise<void> {
  const when = nextStreakRiskDate(lastOpenDate);

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_RISK_ID,
    content: {
      title: 'Your streak is at risk',
      body: 'Open Currio before the day ends and keep your learning streak alive.',
      data: { type: 'streak_at_risk' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
    },
  });
}

export type SyncRemindersOptions = {
  enabled: boolean;
  hours?: number[];
  lastOpenDate?: string | null;
  streakAtRiskEnabled?: boolean;
};

export async function syncLearningReminders(
  options: SyncRemindersOptions,
): Promise<boolean> {
  const {
    enabled,
    hours = [...DEFAULT_REMINDER_HOURS],
    lastOpenDate = null,
    streakAtRiskEnabled = true,
  } = options;

  if (!supportsLocalNotifications()) return false;

  await cancelLearningReminders();

  if (!enabled) return true;

  const granted = await requestLearningReminderPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await scheduleDailyHourReminders(hours);

  if (streakAtRiskEnabled) {
    await scheduleStreakAtRisk(lastOpenDate);
  }

  return true;
}

/** @deprecated Use formatReminderHoursLabel with stored hours */
export const LEARNING_REMINDER_LABEL = formatReminderHoursLabel([
  ...DEFAULT_REMINDER_HOURS,
]);

/** @deprecated Prefer DEFAULT_REMINDER_HOURS */
export const LEARNING_REMINDER_HOURS = DEFAULT_REMINDER_HOURS;
