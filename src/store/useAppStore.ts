import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants';
import { clearPrefetchedNext } from '@/services/curioPrefetchService';
import { pickRandomCurio, getCurioById, getCuriosByCategories } from '@/services/curioService';
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
  hydrate: () => Promise<void>;
  completeOnboarding: (interests: Category[]) => Promise<void>;
  completeWelcome: () => Promise<void>;
  toggleBookmark: (curioId: string) => Promise<void>;
  isBookmarked: (curioId: string) => boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  updateInterests: (interests: Category[]) => Promise<void>;
  recordDailyOpen: () => Promise<void>;
  getTodaysCurio: () => Promise<string>;
  refreshTodaysCurio: () => Promise<string>;
  pickNextCurio: (excludeCurioId?: string, preferredId?: string) => Promise<string>;
}

async function persistState(state: AppState): Promise<void> {
  await setSecureItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  isHydrated: false,

  hydrate: async () => {
    const stored = await getSecureItem(STORAGE_KEYS.APP_STATE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppState;
        set({
          ...parsed,
          hasSeenWelcome: parsed.hasSeenWelcome ?? false,
          isHydrated: true,
        });
        return;
      } catch {
        // fall through to defaults
      }
    }
    set({ isHydrated: true });
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

  pickNextCurio: async (excludeCurioId, preferredId) => {
    const state = get();
    let curio;
    let resetSeen = false;

    if (preferredId) {
      const preferred = getCurioById(preferredId);
      const pool = getCuriosByCategories(state.interests);
      const unseen = pool.filter(
        (candidate) =>
          !state.seenCurioIds.includes(candidate.id) &&
          candidate.id !== excludeCurioId,
      );

      if (preferred && unseen.some((candidate) => candidate.id === preferredId)) {
        curio = preferred;
      } else {
        ({ curio, resetSeen } = pickRandomCurio(
          state.interests,
          state.seenCurioIds,
          excludeCurioId,
        ));
      }
    } else {
      ({ curio, resetSeen } = pickRandomCurio(
        state.interests,
        state.seenCurioIds,
        excludeCurioId,
      ));
    }

    const seenCurioIds = resetSeen
      ? [curio.id]
      : [...state.seenCurioIds, curio.id];

    const next = { ...state, seenCurioIds };
    set(next);
    await persistState(next);
    return curio.id;
  },
}));
