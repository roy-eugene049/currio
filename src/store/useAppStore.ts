import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants';
import { clearPrefetchedNext } from '@/services/curioPrefetchService';
import { pickRandomCurio, getCurioById } from '@/services/curioService';
import { syncLearningReminders } from '@/services/reminderService';
import { getSecureItem, setSecureItem } from '@/services/storage';
import type { AppState, Category, ThemeMode } from '@/types/curio';
import {
  getTodayDateString,
  isConsecutiveDay,
  isSameDay,
} from '@/utils/date';

const initialState: AppState = {
  hasCompletedOnboarding: false,
  hasSeenWelcome: false,
  interests: [],
  bookmarks: [],
  seenCurioIds: [],
  streak: 0,
  lastOpenDate: null,
  themeMode: 'system',
  todaysCurioId: null,
  todaysCurioDate: null,
};

interface AppStore extends AppState {
  isHydrated: boolean;
  learningRemindersEnabled: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: (interests: Category[]) => Promise<void>;
  completeWelcome: () => Promise<void>;
  toggleBookmark: (curioId: string) => Promise<void>;
  isBookmarked: (curioId: string) => boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLearningRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  updateInterests: (interests: Category[]) => Promise<void>;
  recordDailyOpen: () => Promise<void>;
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

  hydrate: async () => {
    const [stored, remindersRaw] = await Promise.all([
      getSecureItem(STORAGE_KEYS.APP_STATE),
      getSecureItem(STORAGE_KEYS.LEARNING_REMINDERS_ENABLED),
    ]);

    const learningRemindersEnabled =
      remindersRaw == null ? true : remindersRaw === '1';

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppState;
        set({
          ...parsed,
          hasSeenWelcome: parsed.hasSeenWelcome ?? false,
          learningRemindersEnabled,
          isHydrated: true,
        });
        return;
      } catch {
        // fall through to defaults
      }
    }
    set({ learningRemindersEnabled, isHydrated: true });
  },

  reconcileForAuthUser: async (userId) => {
    const lastUserId = await getSecureItem(STORAGE_KEYS.LAST_AUTH_USER_ID);
    if (lastUserId === userId) return;

    clearPrefetchedNext();
    const reminders = get().learningRemindersEnabled;
    const fresh = createFreshAppState();
    set({ ...fresh, learningRemindersEnabled: reminders });
    await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(fresh));
    await setSecureItem(STORAGE_KEYS.LOCAL_STATE_UPDATED_AT, new Date(0).toISOString());
    await setSecureItem(STORAGE_KEYS.LAST_AUTH_USER_ID, userId);
  },

  applySyncedState: async (state) => {
    clearPrefetchedNext();
    const reminders = get().learningRemindersEnabled;
    set({ ...state, learningRemindersEnabled: reminders });
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
    const bookmarks = state.bookmarks.includes(curioId)
      ? state.bookmarks.filter((id) => id !== curioId)
      : [...state.bookmarks, curioId];
    const next = { ...state, bookmarks };
    set(next);
    await persistState(next);
  },

  isBookmarked: (curioId) => get().bookmarks.includes(curioId),

  setThemeMode: async (mode) => {
    const next = { ...get(), themeMode: mode };
    set(next);
    await persistState(next);
  },

  setLearningRemindersEnabled: async (enabled) => {
    if (!enabled) {
      set({ learningRemindersEnabled: false });
      await persistLearningRemindersEnabled(false);
      await syncLearningReminders(false);
      return true;
    }

    const scheduled = await syncLearningReminders(true);
    set({ learningRemindersEnabled: scheduled });
    await persistLearningRemindersEnabled(scheduled);
    return scheduled;
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
      return;
    }

    let streak = state.streak;
    if (!state.lastOpenDate) {
      streak = 1;
    } else if (isConsecutiveDay(state.lastOpenDate, today)) {
      streak += 1;
    } else {
      streak = 1;
    }

    const next = { ...state, streak, lastOpenDate: today };
    set(next);
    await persistState(next);
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
