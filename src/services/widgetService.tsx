import {
  formatReminderTime,
  getSoonestUpcomingNudge,
  type ReminderTime,
} from '@/services/reminderService';
import { getSecureItem, setSecureItem } from '@/services/storage';
import { BRAND } from '@/theme/brand';
import type { Category } from '@/types/curio';

import { DAILY_CURIO_WIDGET_NAME, DailyCurioWidget } from '@/widgets/DailyCurioWidget';

const WIDGET_SNAPSHOT_KEY = 'currio_widget_daily_curio';

/** How long after a reminder time the widget stays in “nudge now” mode. */
const NUDGE_WINDOW_AFTER_MS = 25 * 60_000;
/** Slight lead-in before the exact minute. */
const NUDGE_WINDOW_BEFORE_MS = 60_000;

export type WidgetCurioSnapshot = {
  id: string;
  title: string;
  category: Category | string;
  streak: number;
  remindersEnabled: boolean;
  reminderTimes: ReminderTime[];
  /** ISO timestamp — keep nudge-active chrome until this moment after a fired notification. */
  nudgeActiveUntil?: string | null;
  updatedAt: string;
};

export async function readWidgetCurioSnapshot(): Promise<WidgetCurioSnapshot | null> {
  const raw = await getSecureItem(WIDGET_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetCurioSnapshot;
  } catch {
    return null;
  }
}

export async function writeWidgetCurioSnapshot(
  snapshot: Omit<WidgetCurioSnapshot, 'updatedAt'>,
): Promise<void> {
  const payload: WidgetCurioSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  await setSecureItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(payload));
}

function todayAtTime(time: ReminderTime, from: Date): Date {
  const at = new Date(from);
  at.setSeconds(0, 0);
  at.setHours(time.hour, time.minute, 0, 0);
  return at;
}

/** Reminder currently in its active window (around the scheduled clock time). */
export function getActiveNudgeTime(
  times: ReminderTime[],
  from = new Date(),
): ReminderTime | null {
  for (const time of times) {
    const at = todayAtTime(time, from);
    const diff = from.getTime() - at.getTime();
    if (diff >= -NUDGE_WINDOW_BEFORE_MS && diff <= NUDGE_WINDOW_AFTER_MS) {
      return time;
    }
  }
  return null;
}

export function buildWidgetViewModel(
  snapshot: WidgetCurioSnapshot | null,
  from = new Date(),
): {
  title: string;
  category: string;
  streak: number;
  footer: string;
  nudgeActive: boolean;
} {
  const fallback = fallbackWidgetCopy();
  const title = snapshot?.title ?? fallback.title;
  const category = String(snapshot?.category ?? fallback.category);
  const streak = snapshot?.streak ?? 0;
  const remindersEnabled = Boolean(snapshot?.remindersEnabled);
  const times = Array.isArray(snapshot?.reminderTimes)
    ? snapshot!.reminderTimes
    : [];

  const forcedUntil = snapshot?.nudgeActiveUntil
    ? new Date(snapshot.nudgeActiveUntil).getTime()
    : 0;
  const forcedActive = forcedUntil > from.getTime();

  const activeTime =
    remindersEnabled && times.length > 0
      ? getActiveNudgeTime(times, from)
      : null;

  if (forcedActive || activeTime) {
    const when = activeTime ? formatReminderTime(activeTime) : null;
    return {
      title,
      category,
      streak,
      nudgeActive: true,
      footer: when
        ? `Nudge · ${when} · Tap to keep learning`
        : 'Nudge · Tap to keep learning',
    };
  }

  if (remindersEnabled && times.length > 0) {
    const upcoming = getSoonestUpcomingNudge(times, from);
    if (upcoming) {
      return {
        title,
        category,
        streak,
        nudgeActive: false,
        footer: `Next nudge · ${formatReminderTime(upcoming.time)}`,
      };
    }
  }

  return {
    title,
    category,
    streak,
    nudgeActive: false,
    footer: `${category}  ·  Tap to open`,
  };
}

async function pushWidgetFromSnapshot(
  snapshot: WidgetCurioSnapshot,
): Promise<void> {
  const { Platform } = await import('react-native');
  if (Platform.OS !== 'android') return;

  const { isRunningInExpoGo } = await import('expo');
  // Widget native module is not present in Expo Go.
  if (isRunningInExpoGo()) return;

  const view = buildWidgetViewModel(snapshot);

  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    await requestWidgetUpdate({
      widgetName: DAILY_CURIO_WIDGET_NAME,
      renderWidget: () => (
        <DailyCurioWidget
          title={view.title}
          category={view.category}
          streak={view.streak}
          footer={view.footer}
          nudgeActive={view.nudgeActive}
        />
      ),
      widgetNotFound: () => undefined,
    });
  } catch {
    // Native module missing or no widget pinned — ignore.
  }
}

/**
 * Persist + redraw the home widget from app state (curio, streak, reminders).
 */
export async function syncDailyCurioWidget(input?: {
  id?: string;
  title?: string;
  category?: Category | string;
  streak?: number;
  remindersEnabled?: boolean;
  reminderTimes?: ReminderTime[];
  nudgeActiveUntil?: string | null;
}): Promise<void> {
  const existing = await readWidgetCurioSnapshot();

  let storeSlice: {
    streak?: number;
    remindersEnabled?: boolean;
    reminderTimes?: ReminderTime[];
    todaysCurioId?: string | null;
  } = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const state = useAppStore.getState();
    storeSlice = {
      streak: state.streak,
      remindersEnabled: state.learningRemindersEnabled,
      reminderTimes: state.learningReminderTimes,
      todaysCurioId: state.todaysCurioId,
    };
  } catch {
    // Store may be unavailable in headless widget process.
  }

  const next: Omit<WidgetCurioSnapshot, 'updatedAt'> = {
    id: input?.id ?? existing?.id ?? storeSlice.todaysCurioId ?? 'pending',
    title: input?.title ?? existing?.title ?? fallbackWidgetCopy().title,
    category:
      input?.category ?? existing?.category ?? fallbackWidgetCopy().category,
    streak: input?.streak ?? storeSlice.streak ?? existing?.streak ?? 0,
    remindersEnabled:
      input?.remindersEnabled ??
      storeSlice.remindersEnabled ??
      existing?.remindersEnabled ??
      false,
    reminderTimes:
      input?.reminderTimes ??
      storeSlice.reminderTimes ??
      existing?.reminderTimes ??
      [],
    nudgeActiveUntil:
      input?.nudgeActiveUntil !== undefined
        ? input.nudgeActiveUntil
        : (existing?.nudgeActiveUntil ?? null),
  };

  await writeWidgetCurioSnapshot(next);
  await pushWidgetFromSnapshot({
    ...next,
    updatedAt: new Date().toISOString(),
  });
}

/** Mark that a scheduled nudge just fired so the widget shows nudge chrome. */
export async function markWidgetNudgeActive(
  durationMs = NUDGE_WINDOW_AFTER_MS,
): Promise<void> {
  const until = new Date(Date.now() + durationMs).toISOString();
  await syncDailyCurioWidget({ nudgeActiveUntil: until });
}

export function fallbackWidgetCopy() {
  return {
    title: 'Open Currio for today’s curiosity',
    category: 'Currio',
    accent: BRAND.electric,
  };
}
