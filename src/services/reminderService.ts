import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/** Four gentle nudges across waking hours (~every 4 hours). */
export const LEARNING_REMINDER_HOURS = [9, 13, 17, 21] as const;

export const LEARNING_REMINDER_LABEL = '9am · 1pm · 5pm · 9pm';

const CHANNEL_ID = 'learning-reminders';
const IDENTIFIER_PREFIX = 'currio-learn-reminder-';

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

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Learning reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lightColor: '#6F00FF',
  });
}

export async function getLearningReminderPermissionStatus(): Promise<
  Notifications.PermissionStatus | 'unsupported'
> {
  if (!supportsLocalNotifications()) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
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
      .filter((item) => item.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function scheduleLearningReminders(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  const granted = await requestLearningReminderPermission();
  if (!granted) {
    await cancelLearningReminders();
    return false;
  }

  await ensureAndroidChannel();
  await cancelLearningReminders();

  await Promise.all(
    LEARNING_REMINDER_HOURS.map((hour, index) => {
      const copy = REMINDER_COPY[index % REMINDER_COPY.length];
      return Notifications.scheduleNotificationAsync({
        identifier: `${IDENTIFIER_PREFIX}${hour}`,
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

  return true;
}

export async function syncLearningReminders(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    await cancelLearningReminders();
    return true;
  }

  return scheduleLearningReminders();
}
