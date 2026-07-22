import { Image, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { BRAND } from '@/theme/brand';
import { getTodayDateString } from '@/utils/date';

export type ReminderTime = {
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER_TIMES: ReminderTime[] = [
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 21, minute: 0 },
];

/** @deprecated Prefer DEFAULT_REMINDER_TIMES */
export const DEFAULT_REMINDER_HOURS = [9, 13, 21] as const;

export const MIN_REMINDER_TIMES = 1;
export const MAX_REMINDER_TIMES = 5;

/** @deprecated Prefer MIN/MAX_REMINDER_TIMES */
export const MIN_REMINDER_HOURS = MIN_REMINDER_TIMES;
/** @deprecated Prefer MIN/MAX_REMINDER_TIMES */
export const MAX_REMINDER_HOURS = MAX_REMINDER_TIMES;

/** Evening nudge if they haven’t opened Currio yet today. */
export const STREAK_AT_RISK_HOUR = 20;
export const STREAK_AT_RISK_MINUTE = 0;

/** New id — Android locks channel importance after first create. */
const CHANNEL_ID = 'curiosity-nudges-v2';
const LEGACY_CHANNEL_ID = 'learning-reminders';
const REMINDER_PREFIX = 'currio-nudge-';
const STREAK_RISK_ID = 'currio-streak-at-risk';
const TEST_ID = 'currio-nudge-test';
const NOTIFICATION_COLOR = BRAND.electric;

const RICH_LOGO = require('../../assets/images/notification-rich.png');

const REMINDER_COPY = [
  {
    title: 'Time for a currio',
    subtitle: 'Curiosity nudge',
    body: 'Open Currio and learn something new in under a minute.',
  },
  {
    title: 'Keep your streak going',
    subtitle: 'Curiosity nudge',
    body: 'A quick currio is waiting — open the app and keep learning.',
  },
  {
    title: 'Curiosity break',
    subtitle: 'Curiosity nudge',
    body: 'Step away for a moment and discover today’s next fact.',
  },
  {
    title: 'Learn something new',
    subtitle: 'Curiosity nudge',
    body: 'Your next curio is ready whenever you are.',
  },
  {
    title: 'A spark of curiosity',
    subtitle: 'Curiosity nudge',
    body: 'One fresh fact is waiting — tap in when you’re ready.',
  },
] as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function supportsLocalNotifications() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function resolveRichLogoUri(): string | null {
  try {
    const resolved = Image.resolveAssetSource(RICH_LOGO);
    return resolved?.uri ?? null;
  } catch {
    return null;
  }
}

function brandedNudgeContent(input: {
  title: string;
  body: string;
  subtitle?: string;
  data: Record<string, unknown>;
}): Notifications.NotificationContentInput {
  const logoUri = resolveRichLogoUri();
  const subtitle = input.subtitle ?? 'Currio';

  return {
    title: input.title,
    subtitle,
    body: input.body,
    data: input.data,
    sound: true,
    ...(Platform.OS === 'android'
      ? {
          channelId: CHANNEL_ID,
          color: NOTIFICATION_COLOR,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }
      : {
          // Rich logo preview in the expanded iOS notification.
          ...(logoUri
            ? {
                attachments: [
                  {
                    identifier: 'currio-logo',
                    url: logoUri,
                    type: 'public.png',
                  },
                ],
              }
            : null),
        }),
  };
}

function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return 9;
  return Math.min(23, Math.max(0, Math.round(hour)));
}

function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.min(59, Math.max(0, Math.round(minute)));
}

export function reminderTimeKey(time: ReminderTime): string {
  return `${clampHour(time.hour)}:${clampMinute(time.minute)}`;
}

export function formatReminderTime(time: ReminderTime): string {
  const hour = clampHour(time.hour);
  const minute = clampMinute(time.minute);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute.toString().padStart(2, '0');
  return `${h12}:${mm} ${suffix}`;
}

/** @deprecated Prefer formatReminderTime */
export function formatReminderHour(hour: number): string {
  return formatReminderTime({ hour, minute: 0 });
}

export function formatReminderTimesLabel(times: ReminderTime[]): string {
  if (times.length === 0) return 'No times set';
  return sortReminderTimes(times).map(formatReminderTime).join(' · ');
}

/** @deprecated Prefer formatReminderTimesLabel */
export function formatReminderHoursLabel(hours: number[]): string {
  return formatReminderTimesLabel(hours.map((hour) => ({ hour, minute: 0 })));
}

export function sortReminderTimes(times: ReminderTime[]): ReminderTime[] {
  return [...times].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );
}

export function normalizeReminderTimes(times: ReminderTime[]): ReminderTime[] {
  const seen = new Set<string>();
  const unique: ReminderTime[] = [];

  for (const raw of times) {
    const time = {
      hour: clampHour(raw.hour),
      minute: clampMinute(raw.minute),
    };
    const key = reminderTimeKey(time);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(time);
  }

  const sorted = sortReminderTimes(unique);
  if (sorted.length >= MIN_REMINDER_TIMES) {
    return sorted.slice(0, MAX_REMINDER_TIMES);
  }

  return [...DEFAULT_REMINDER_TIMES];
}

/**
 * Accepts legacy `number[]` hours or `{ hour, minute }[]`.
 */
export function parseStoredReminderTimes(raw: unknown): ReminderTime[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_REMINDER_TIMES];
  }

  if (typeof raw[0] === 'number') {
    return normalizeReminderTimes(
      (raw as number[]).map((hour) => ({ hour, minute: 0 })),
    );
  }

  return normalizeReminderTimes(
    (raw as Partial<ReminderTime>[]).map((item) => ({
      hour: typeof item?.hour === 'number' ? item.hour : 9,
      minute: typeof item?.minute === 'number' ? item.minute : 0,
    })),
  );
}

/** @deprecated Prefer normalizeReminderTimes */
export function normalizeReminderHours(hours: number[]): number[] {
  return normalizeReminderTimes(
    hours.map((hour) => ({ hour, minute: 0 })),
  ).map((t) => t.hour);
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  // Drop the legacy DEFAULT-importance channel if present.
  await Notifications.deleteNotificationChannelAsync(LEGACY_CHANNEL_ID).catch(
    () => undefined,
  );

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Curiosity nudges',
    description: 'Daily reminders to open Currio and learn something new.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 220, 120, 220],
    lightColor: '#6F00FF',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    enableVibrate: true,
    showBadge: false,
  });
}

export async function requestLearningReminderPermission(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getReminderPermissionGranted(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;
  const current = await Notifications.getPermissionsAsync();
  return (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function cancelLearningReminders(): Promise<void> {
  if (!supportsLocalNotifications()) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) =>
          item.identifier.startsWith(REMINDER_PREFIX) ||
          item.identifier === STREAK_RISK_ID ||
          item.identifier === TEST_ID ||
          // Legacy ids from hour-only scheduling
          item.identifier.startsWith('currio-learn-reminder-'),
      )
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
}

/** Next local Date for hour:minute (today if still upcoming, else tomorrow). */
export function nextOccurrenceDate(time: ReminderTime, from = new Date()): Date {
  const target = new Date(from);
  target.setSeconds(0, 0);
  target.setHours(clampHour(time.hour), clampMinute(time.minute), 0, 0);
  if (target.getTime() <= from.getTime() + 1500) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function androidTriggerExtras() {
  return Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};
}

/**
 * Schedule the next several one-shot DATE triggers per time.
 * More reliable than DAILY on Android (OEM / Doze / exact-alarm limits),
 * and we refill the window whenever the app opens.
 */
const SCHEDULE_HORIZON_DAYS = 14;

async function scheduleDailyNudges(times: ReminderTime[]): Promise<number> {
  const normalized = normalizeReminderTimes(times);
  let scheduledCount = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const time = normalized[index]!;
    const copy = REMINDER_COPY[index % REMINDER_COPY.length]!;
    const content = brandedNudgeContent({
      title: copy.title,
      subtitle: copy.subtitle,
      body: copy.body,
      data: {
        type: 'learning_reminder',
        hour: time.hour,
        minute: time.minute,
      },
    });

    let cursor = new Date();
    for (let day = 0; day < SCHEDULE_HORIZON_DAYS; day += 1) {
      const when = nextOccurrenceDate(time, cursor);
      const stamp = `${when.getFullYear()}${String(when.getMonth() + 1).padStart(2, '0')}${String(when.getDate()).padStart(2, '0')}`;
      const id = `${REMINDER_PREFIX}${time.hour}-${time.minute}-${stamp}`;

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            ...androidTriggerExtras(),
          },
        });
        scheduledCount += 1;
      } catch (error) {
        console.warn('[Currio] Failed to schedule nudge', id, error);
      }

      // Move past this occurrence so the next loop finds the following day.
      cursor = new Date(when.getTime() + 60_000);
    }

    if (__DEV__) {
      console.log(
        '[Currio] Scheduled',
        SCHEDULE_HORIZON_DAYS,
        'nudges for',
        formatReminderTime(time),
        'first at',
        nextOccurrenceDate(time).toString(),
      );
    }
  }

  return scheduledCount;
}

function nextStreakRiskDate(lastOpenDate: string | null): Date {
  const now = new Date();
  const today = getTodayDateString();
  const target = new Date(now);
  target.setHours(STREAK_AT_RISK_HOUR, STREAK_AT_RISK_MINUTE, 0, 0);

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
    content: brandedNudgeContent({
      title: 'Your streak is at risk',
      subtitle: 'Streak watch',
      body: 'Open Currio before the day ends and keep your learning streak alive.',
      data: { type: 'streak_at_risk' },
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
    },
  });
}

export type SyncRemindersOptions = {
  enabled: boolean;
  times?: ReminderTime[];
  /** @deprecated Prefer times */
  hours?: number[];
  lastOpenDate?: string | null;
  streakAtRiskEnabled?: boolean;
};

export async function syncLearningReminders(
  options: SyncRemindersOptions,
): Promise<boolean> {
  const {
    enabled,
    lastOpenDate = null,
    streakAtRiskEnabled = true,
  } = options;

  const times =
    options.times ??
    (options.hours
      ? options.hours.map((hour) => ({ hour, minute: 0 }))
      : DEFAULT_REMINDER_TIMES);

  if (!supportsLocalNotifications()) {
    if (__DEV__) {
      console.warn(
        '[Currio] Local notifications are only available on iOS/Android.',
      );
    }
    return false;
  }

  await cancelLearningReminders();

  if (!enabled) return true;

  const granted = await requestLearningReminderPermission();
  if (!granted) {
    if (__DEV__) {
      console.warn('[Currio] Notification permission not granted.');
    }
    return false;
  }

  await ensureAndroidChannel();
  const scheduledCount = await scheduleDailyNudges(times);

  if (streakAtRiskEnabled) {
    await scheduleStreakAtRisk(lastOpenDate);
  }

  if (__DEV__) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(
      '[Currio] Scheduled nudges:',
      scheduled.map((item) => item.identifier),
    );
  }

  return scheduledCount > 0;
}

/** Fire a one-off nudge soon so the user can verify notifications work. */
export async function scheduleTestNudge(
  delaySeconds = 8,
): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  const granted = await requestLearningReminderPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(TEST_ID).catch(() => undefined);

  await Notifications.scheduleNotificationAsync({
    identifier: TEST_ID,
    content: brandedNudgeContent({
      title: 'Curiosity nudge',
      subtitle: 'Currio',
      body: 'Notifications are working — your scheduled times will look like this.',
      data: { type: 'learning_reminder_test' },
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(3, delaySeconds),
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
    },
  });

  return true;
}

export async function getScheduledNudgeCount(): Promise<number> {
  if (!supportsLocalNotifications()) return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (item) =>
      item.identifier.startsWith(REMINDER_PREFIX) ||
      item.identifier === STREAK_RISK_ID,
  ).length;
}

/** Human label for when the next custom nudge will fire. */
export function formatNextNudgeLabel(time: ReminderTime, from = new Date()): string {
  const next = nextOccurrenceDate(time, from);
  const today = new Date(from);
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const when = formatReminderTime(time);
  if (sameDay(next, today)) return `Next nudge today at ${when}`;
  if (sameDay(next, tomorrow)) return `Next nudge tomorrow at ${when}`;
  return `Next nudge ${next.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} at ${when}`;
}

/**
 * Android 12+ may require an explicit “Alarms & reminders” grant for exact times.
 * Opens the system screen when possible.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  const pkg = 'com.twiicetech.currio';
  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', [
      { key: 'android.provider.extra.APP_PACKAGE', value: pkg },
    ]);
  } catch {
    try {
      await Linking.openURL(
        `package:${pkg}`,
      );
    } catch {
      await Linking.openSettings();
    }
  }
}

/** @deprecated Use formatReminderTimesLabel with stored times */
export const LEARNING_REMINDER_LABEL = formatReminderTimesLabel(
  DEFAULT_REMINDER_TIMES,
);

/** @deprecated Prefer DEFAULT_REMINDER_TIMES */
export const LEARNING_REMINDER_HOURS = DEFAULT_REMINDER_HOURS;

/** @deprecated Fixed hour chips — any hour/minute is now allowed */
export const REMINDER_HOUR_OPTIONS = [8, 9, 12, 13, 17, 18, 20, 21] as const;
