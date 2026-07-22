import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants';
import { clearPrefetchedNext } from '@/services/curioPrefetchService';
import { pickRandomCurio, getCurioById } from '@/services/curioService';
import {
  DEFAULT_REMINDER_HOURS,
  normalizeReminderHours,
  syncLearningReminders,
} from '@/services/reminderService';
import { getSecureItem, setSecureItem } from '@/services/storage';
import type { AppState, Category, CurioCollection, ThemeMode } from '@/types/curio';
import {
  createCollectionId,
  normalizeCollectionName,
  stripCurioFromCollections,
  toggleCurioInCollection,
} from '@/utils/collections';
import {
  getTodayDateString,
  getWeekKey,
  isConsecutiveDay,
  isSameDay,
} from '@/utils/date';

const initialState: AppState = {
  hasCompletedOnboarding: false,
  hasSeenWelcome: false,
  interests: [],
  bookmarks: [],
  collections: [],
  seenCurioIds: [],
  streak: 0,
  lastOpenDate: null,
  themeMode: 'system',
  todaysCurioId: null,
  todaysCurioDate: null,
  weeklyDigestEnabled: true,
};

interface AppStore extends AppState {
  isHydrated: boolean;
  learningRemindersEnabled: boolean;
  learningReminderHours: number[];
  streakFreezeWeekKey: string | null;
  hydrate: () => Promise<void>;
  completeOnboarding: (interests: Category[]) => Promise<void>;
  completeWelcome: () => Promise<void>;
  toggleBookmark: (curioId: string) => Promise<void>;
  isBookmarked: (curioId: string) => boolean;
  createCollection: (name: string) => Promise<CurioCollection | null>;
  renameCollection: (collectionId: string, name: string) => Promise<boolean>;
  deleteCollection: (collectionId: string) => Promise<void>;
  toggleCurioCollection: (collectionId: string, curioId: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLearningRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  setLearningReminderHours: (hours: number[]) => Promise<boolean>;
  setWeeklyDigestEnabled: (enabled: boolean) => Promise<void>;
  updateInterests: (interests: Category[]) => Promise<void>;
  recordDailyOpen: () => Promise<void>;
  rescheduleReminders: () => Promise<void>;
  getTodaysCurio: () => Promise<string>;
  refreshTodaysCurio: () => Promise<string>;
  pickNextCurio: (
    excludeCurioId?: string,
    preferredId?: string,
    currentCategory?: Category,
    resetSeen?: boolean,
  ) => Promise<string>;
  reconcileForAuthUser: (userId: string) => Promise<void>;
  applySyncedState: (state: AppState) => Promise<void>;
  recordRemoteCurio: (curioId: string, options?: { isDaily?: boolean }) => Promise<void>;
}

async function persistLearningRemindersEnabled(enabled: boolean) {
  await setSecureItem(
    STORAGE_KEYS.LEARNING_REMINDERS_ENABLED,
    enabled ? '1' : '0',
  );
}

async function persistLearningReminderHours(hours: number[]) {
  await setSecureItem(
    STORAGE_KEYS.LEARNING_REMINDER_HOURS,
    JSON.stringify(normalizeReminderHours(hours)),
  );
}

async function persistStreakFreezeWeek(weekKey: string | null) {
  await setSecureItem(STORAGE_KEYS.STREAK_FREEZE_WEEK, weekKey ?? '');
}

async function pushReminderSchedule(getState: () => AppStore) {
  const state = getState();
  if (!state.learningRemindersEnabled) {
    await syncLearningReminders({ enabled: false });
    return false;
  }

  return syncLearningReminders({
    enabled: true,
    hours: state.learningReminderHours,
    lastOpenDate: state.lastOpenDate,
    streakAtRiskEnabled: true,
  });
}

const MAX_PERSISTED_SEEN_IDS = 48;

async function persistState(state: AppState): Promise<void> {
  const payload: AppState = {
    ...state,
    seenCurioIds:
      state.seenCurioIds.length > MAX_PERSISTED_SEEN_IDS
        ? state.seenCurioIds.slice(-MAX_PERSISTED_SEEN_IDS)
        : state.seenCurioIds,
  };
  await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(payload));
  await setSecureItem(STORAGE_KEYS.LOCAL_STATE_UPDATED_AT, new Date().toISOString());
  void import('@/services/syncService').then(({ schedulePush }) => schedulePush());
}

function createFreshAppState(): AppState {
  return { ...initialState };
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  isHydrated: false,
  learningRemindersEnabled: true,
  learningReminderHours: [...DEFAULT_REMINDER_HOURS],
  streakFreezeWeekKey: null,

  hydrate: async () => {
    const [stored, remindersRaw, hoursRaw, freezeRaw] = await Promise.all([
      getSecureItem(STORAGE_KEYS.APP_STATE),
      getSecureItem(STORAGE_KEYS.LEARNING_REMINDERS_ENABLED),
      getSecureItem(STORAGE_KEYS.LEARNING_REMINDER_HOURS),
      getSecureItem(STORAGE_KEYS.STREAK_FREEZE_WEEK),
    ]);

    const learningRemindersEnabled =
      remindersRaw == null ? true : remindersRaw === '1';

    let learningReminderHours = [...DEFAULT_REMINDER_HOURS];
    if (hoursRaw) {
      try {
        learningReminderHours = normalizeReminderHours(
          JSON.parse(hoursRaw) as number[],
        );
      } catch {
        learningReminderHours = [...DEFAULT_REMINDER_HOURS];
      }
    }

    const streakFreezeWeekKey = freezeRaw ? freezeRaw : null;

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppState;
        set({
          ...parsed,
          hasSeenWelcome: parsed.hasSeenWelcome ?? false,
          weeklyDigestEnabled: parsed.weeklyDigestEnabled ?? true,
          collections: Array.isArray(parsed.collections) ? parsed.collections : [],
          learningRemindersEnabled,
          learningReminderHours,
          streakFreezeWeekKey,
          isHydrated: true,
        });
        return;
      } catch {
        // fall through to defaults
      }
    }
    set({
      learningRemindersEnabled,
      learningReminderHours,
      streakFreezeWeekKey,
      isHydrated: true,
    });
  },

  reconcileForAuthUser: async (userId) => {
    const lastUserId = await getSecureItem(STORAGE_KEYS.LAST_AUTH_USER_ID);
    if (lastUserId === userId) return;

    clearPrefetchedNext();
    const reminders = get().learningRemindersEnabled;
    const hours = get().learningReminderHours;
    const freeze = get().streakFreezeWeekKey;
    const fresh = createFreshAppState();
    set({
      ...fresh,
      learningRemindersEnabled: reminders,
      learningReminderHours: hours,
      streakFreezeWeekKey: freeze,
    });
    await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(fresh));
    await setSecureItem(STORAGE_KEYS.LOCAL_STATE_UPDATED_AT, new Date(0).toISOString());
    await setSecureItem(STORAGE_KEYS.LAST_AUTH_USER_ID, userId);
  },

  applySyncedState: async (state) => {
    clearPrefetchedNext();
    const reminders = get().learningRemindersEnabled;
    const hours = get().learningReminderHours;
    const freeze = get().streakFreezeWeekKey;
    set({
      ...state,
      learningRemindersEnabled: reminders,
      learningReminderHours: hours,
      streakFreezeWeekKey: freeze,
    });
    await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
  },

  recordRemoteCurio: async (curioId, options) => {
    const state = get();
    const today = getTodayDateString();
    const seenCurioIds = state.seenCurioIds.includes(curioId)
      ? state.seenCurioIds
      : [...state.seenCurioIds, curioId];

    const next: AppState = {
      ...state,
      seenCurioIds,
      ...(options?.isDaily
        ? { todaysCurioId: curioId, todaysCurioDate: today }
        : {}),
    };

    set(next);
    await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(next));
  },

  completeOnboarding: async (interests) => {
    const state = get();
    const next: AppState = {
      ...state,
      hasCompletedOnboarding: true,
      interests,
      seenCurioIds: [],
      todaysCurioId: null,
      todaysCurioDate: null,
    };
    set(next);
    await persistState(next);
    const { pushNow } = await import('@/services/syncService');
    await pushNow();
  },

  completeWelcome: async () => {
    const next = { ...get(), hasSeenWelcome: true };
    set(next);
    await persistState(next);
  },

  toggleBookmark: async (curioId) => {
    const state = get();
    const removing = state.bookmarks.includes(curioId);
    const bookmarks = removing
      ? state.bookmarks.filter((id) => id !== curioId)
      : [...state.bookmarks, curioId];
    const collections = removing
      ? stripCurioFromCollections(state.collections, curioId)
      : state.collections;
    const next = { ...state, bookmarks, collections };
    set(next);
    await persistState(next);
  },

  isBookmarked: (curioId) => get().bookmarks.includes(curioId),

  createCollection: async (name) => {
    const normalized = normalizeCollectionName(name);
    if (!normalized) return null;

    const collection: CurioCollection = {
      id: createCollectionId(),
      name: normalized,
      curioIds: [],
      updatedAt: new Date().toISOString(),
    };
    const state = get();
    const next = {
      ...state,
      collections: [collection, ...state.collections],
    };
    set(next);
    await persistState(next);
    return collection;
  },

  renameCollection: async (collectionId, name) => {
    const normalized = normalizeCollectionName(name);
    if (!normalized) return false;

    const state = get();
    const collections = state.collections.map((collection) =>
      collection.id === collectionId
        ? { ...collection, name: normalized, updatedAt: new Date().toISOString() }
        : collection,
    );
    const next = { ...state, collections };
    set(next);
    await persistState(next);
    return true;
  },

  deleteCollection: async (collectionId) => {
    const state = get();
    const next = {
      ...state,
      collections: state.collections.filter((c) => c.id !== collectionId),
    };
    set(next);
    await persistState(next);
  },

  toggleCurioCollection: async (collectionId, curioId) => {
    const state = get();
    let bookmarks = state.bookmarks;
    if (!bookmarks.includes(curioId)) {
      bookmarks = [...bookmarks, curioId];
    }
    const collections = toggleCurioInCollection(
      state.collections,
      collectionId,
      curioId,
    );
    const next = { ...state, bookmarks, collections };
    set(next);
    await persistState(next);
  },

  setThemeMode: async (mode) => {
    const next = { ...get(), themeMode: mode };
    set(next);
    await persistState(next);
  },

  setWeeklyDigestEnabled: async (enabled) => {
    const next = { ...get(), weeklyDigestEnabled: enabled };
    set(next);
    await persistState(next);
  },

  setLearningRemindersEnabled: async (enabled) => {
    if (!enabled) {
      set({ learningRemindersEnabled: false });
      await persistLearningRemindersEnabled(false);
      await syncLearningReminders({ enabled: false });
      return true;
    }

    set({ learningRemindersEnabled: true });
    await persistLearningRemindersEnabled(true);
    const scheduled = await pushReminderSchedule(get);
    if (!scheduled) {
      set({ learningRemindersEnabled: false });
      await persistLearningRemindersEnabled(false);
    }
    return scheduled;
  },

  setLearningReminderHours: async (hours) => {
    const normalized = normalizeReminderHours(hours);
    set({ learningReminderHours: normalized });
    await persistLearningReminderHours(normalized);

    if (!get().learningRemindersEnabled) return true;
    return pushReminderSchedule(get);
  },

  rescheduleReminders: async () => {
    if (!get().learningRemindersEnabled) return;
    await pushReminderSchedule(get);
  },

  updateInterests: async (interests) => {
    clearPrefetchedNext();
    const next = {
      ...get(),
      interests,
      seenCurioIds: [],
      todaysCurioId: null,
      todaysCurioDate: null,
    };
    set(next);
    await persistState(next);
  },

  recordDailyOpen: async () => {
    const state = get();
    const today = getTodayDateString();

    if (state.lastOpenDate && isSameDay(state.lastOpenDate, today)) {
      await get().rescheduleReminders();
      return;
    }

    let streak = state.streak;
    let streakFreezeWeekKey = state.streakFreezeWeekKey;
    const weekKey = getWeekKey();

    if (!state.lastOpenDate) {
      streak = 1;
    } else if (isConsecutiveDay(state.lastOpenDate, today)) {
      streak += 1;
    } else {
      const freezeAvailable = streakFreezeWeekKey !== weekKey;
      if (freezeAvailable && streak > 0) {
        // One missed-day protection per calendar week.
        streakFreezeWeekKey = weekKey;
        await persistStreakFreezeWeek(weekKey);
      } else {
        streak = 1;
      }
    }

    const next = { ...state, streak, lastOpenDate: today };
    set({ ...next, streakFreezeWeekKey });
    await persistState(next);
    await get().rescheduleReminders();
  },

  getTodaysCurio: async () => {
    const state = get();
    const today = getTodayDateString();

    if (
      state.todaysCurioId &&
      state.todaysCurioDate &&
      isSameDay(state.todaysCurioDate, today)
    ) {
      return state.todaysCurioId;
    }

    return get().refreshTodaysCurio();
  },

  refreshTodaysCurio: async () => {
    const state = get();
    const today = getTodayDateString();
    const { curio, resetSeen } = pickRandomCurio(
      state.interests,
      state.seenCurioIds,
    );

    const seenCurioIds = resetSeen
      ? [curio.id]
      : [...state.seenCurioIds, curio.id];

    const next = {
      ...state,
      todaysCurioId: curio.id,
      todaysCurioDate: today,
      seenCurioIds,
    };
    set(next);
    await persistState(next);
    return curio.id;
  },

  pickNextCurio: async (excludeCurioId, preferredId, currentCategory, resetSeen = false) => {
    const state = get();

    if (preferredId) {
      const seenCurioIds = resetSeen
        ? [preferredId]
        : state.seenCurioIds.includes(preferredId)
          ? state.seenCurioIds
          : [...state.seenCurioIds, preferredId];

      const next = { ...state, seenCurioIds };
      set(next);
      await persistState(next);
      return preferredId;
    }

    const excludeCategory =
      state.interests.length > 1
        ? (currentCategory ?? getCurioById(excludeCurioId ?? '')?.category)
        : undefined;
    let curio;
    let didResetSeen = false;

    ({ curio, resetSeen: didResetSeen } = pickRandomCurio(
      state.interests,
      state.seenCurioIds,
      excludeCurioId,
      excludeCategory,
    ));

    const seenCurioIds = didResetSeen
      ? [curio.id]
      : [...state.seenCurioIds, curio.id];

    const next = { ...state, seenCurioIds };
    set(next);
    await persistState(next);
    return curio.id;
  },
}));
