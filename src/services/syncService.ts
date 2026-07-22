import { STORAGE_KEYS } from '@/constants';
import { ENV } from '@/constants/env';
import { getSecureItem, setSecureItem } from '@/services/storage';
import { getSupabase } from '@/services/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppState, Category, CurioCollection, ThemeMode } from '@/types/curio';
import { sortCollections } from '@/utils/collections';

type RemoteAppStateRow = {
  user_id: string;
  has_completed_onboarding: boolean;
  has_seen_welcome: boolean;
  streak: number;
  last_open_date: string | null;
  theme_mode: ThemeMode;
  todays_curio_id: string | null;
  todays_curio_date: string | null;
  weekly_digest_enabled?: boolean;
  updated_at: string;
};

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight: Promise<void> | null = null;
let pullInFlight: Promise<void> | null = null;

function isAuthBackendError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : '';
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

  return (
    status === 401 ||
    status === 403 ||
    code === '42501' ||
    message.includes('jwt') ||
    message.includes('permission denied') ||
    message.includes('violates row-level security')
  );
}

function validateSessionAfterAuthFailure(error: unknown) {
  if (!isAuthBackendError(error)) return;
  void useAuthStore.getState().validateSession();
}

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export function isSyncEnabled(): boolean {
  return ENV.isSupabaseConfigured && Boolean(getUserId());
}

async function getLocalUpdatedAtMs(): Promise<number> {
  const raw = await getSecureItem(STORAGE_KEYS.LOCAL_STATE_UPDATED_AT);
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function setLocalUpdatedAt(iso: string): Promise<void> {
  await setSecureItem(STORAGE_KEYS.LOCAL_STATE_UPDATED_AT, iso);
}

function remoteToAppState(
  row: RemoteAppStateRow,
  interests: Category[],
  bookmarks: string[],
  seenCurioIds: string[],
  collections: CurioCollection[],
): AppState {
  return {
    hasCompletedOnboarding: row.has_completed_onboarding,
    hasSeenWelcome: row.has_seen_welcome,
    interests,
    bookmarks,
    collections,
    seenCurioIds,
    streak: row.streak,
    lastOpenDate: row.last_open_date,
    themeMode: row.theme_mode,
    todaysCurioId: row.todays_curio_id,
    todaysCurioDate: row.todays_curio_date,
    weeklyDigestEnabled: row.weekly_digest_enabled ?? true,
  };
}

async function pullRemote(userId: string) {
  const supabase = getSupabase();

  const [appStateRes, interestsRes, bookmarksRes, seenRes, collectionsRes] =
    await Promise.all([
      supabase
        .from('user_app_state')
        .select(
          'user_id, has_completed_onboarding, has_seen_welcome, streak, last_open_date, theme_mode, todays_curio_id, todays_curio_date, weekly_digest_enabled, updated_at',
        )
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('user_interests').select('category').eq('user_id', userId),
      supabase.from('bookmarks').select('curio_id').eq('user_id', userId),
      supabase.from('user_seen_curios').select('curio_id').eq('user_id', userId),
      supabase
        .from('collections')
        .select('id, name, updated_at, collection_items(curio_id)')
        .eq('user_id', userId),
    ]);

  if (appStateRes.error) throw appStateRes.error;
  if (interestsRes.error) throw interestsRes.error;
  if (bookmarksRes.error) throw bookmarksRes.error;
  if (seenRes.error) throw seenRes.error;
  if (collectionsRes.error) throw collectionsRes.error;

  const collections: CurioCollection[] = sortCollections(
    (collectionsRes.data ?? []).map((row) => {
      const items = (row.collection_items ?? []) as { curio_id: string }[];
      return {
        id: row.id as string,
        name: row.name as string,
        updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
        curioIds: items.map((item) => item.curio_id),
      };
    }),
  );

  return {
    appState: appStateRes.data,
    interests: (interestsRes.data ?? []).map((row) => row.category as Category),
    bookmarks: (bookmarksRes.data ?? []).map((row) => row.curio_id),
    seenCurioIds: (seenRes.data ?? []).map((row) => row.curio_id),
    collections,
  };
}

async function pushInterests(userId: string, interests: Category[]): Promise<void> {
  const supabase = getSupabase();
  const { data: remote, error: readError } = await supabase
    .from('user_interests')
    .select('category')
    .eq('user_id', userId);

  if (readError) throw readError;

  const localSet = new Set(interests);
  const toDelete =
    remote?.filter((row) => !localSet.has(row.category as Category)).map((row) => row.category) ??
    [];

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
      .in('category', toDelete);
    if (error) throw error;
  }

  if (interests.length === 0) return;

  const { error } = await supabase.from('user_interests').upsert(
    interests.map((category) => ({ user_id: userId, category })),
    { onConflict: 'user_id,category' },
  );
  if (error) throw error;
}

async function pushBookmarks(userId: string, bookmarks: string[]): Promise<void> {
  const supabase = getSupabase();
  const { data: remote, error: readError } = await supabase
    .from('bookmarks')
    .select('curio_id')
    .eq('user_id', userId);

  if (readError) throw readError;

  const localSet = new Set(bookmarks);
  const toDelete =
    remote?.filter((row) => !localSet.has(row.curio_id)).map((row) => row.curio_id) ?? [];

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .in('curio_id', toDelete);
    if (error) throw error;
  }

  if (bookmarks.length === 0) return;

  const { error } = await supabase.from('bookmarks').upsert(
    bookmarks.map((curio_id) => ({ user_id: userId, curio_id })),
    { onConflict: 'user_id,curio_id' },
  );
  if (error) throw error;
}

async function pushSeenCurios(userId: string, seenCurioIds: string[]): Promise<void> {
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from('user_seen_curios')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;

  if (seenCurioIds.length === 0) return;

  const { error } = await supabase.from('user_seen_curios').insert(
    seenCurioIds.map((curio_id) => ({ user_id: userId, curio_id })),
  );
  if (error) throw error;
}

async function pushCollections(
  userId: string,
  collections: CurioCollection[],
): Promise<void> {
  const supabase = getSupabase();
  const { data: remote, error: readError } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId);

  if (readError) throw readError;

  const localIds = new Set(collections.map((c) => c.id));
  const toDelete =
    remote?.filter((row) => !localIds.has(row.id)).map((row) => row.id) ?? [];

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', userId)
      .in('id', toDelete);
    if (error) throw error;
  }

  if (collections.length === 0) return;

  const { error: upsertError } = await supabase.from('collections').upsert(
    collections.map((collection) => ({
      id: collection.id,
      user_id: userId,
      name: collection.name,
      updated_at: collection.updatedAt,
    })),
    { onConflict: 'id' },
  );
  if (upsertError) throw upsertError;

  await Promise.all(
    collections.map(async (collection) => {
      const { data: remoteItems, error: itemsReadError } = await supabase
        .from('collection_items')
        .select('curio_id')
        .eq('collection_id', collection.id);
      if (itemsReadError) throw itemsReadError;

      const localSet = new Set(collection.curioIds);
      const removeIds =
        remoteItems
          ?.filter((row) => !localSet.has(row.curio_id))
          .map((row) => row.curio_id) ?? [];

      if (removeIds.length > 0) {
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collection.id)
          .in('curio_id', removeIds);
        if (error) throw error;
      }

      if (collection.curioIds.length === 0) return;

      const { error } = await supabase.from('collection_items').upsert(
        collection.curioIds.map((curio_id) => ({
          collection_id: collection.id,
          curio_id,
        })),
        { onConflict: 'collection_id,curio_id' },
      );
      if (error) throw error;
    }),
  );
}

/**
 * Pull cloud state and merge with local using latest `user_app_state.updated_at`.
 */
export async function pullAndMerge(): Promise<void> {
  if (!isSyncEnabled()) return;

  const userId = getUserId();
  if (!userId) return;

  if (pullInFlight) {
    await pullInFlight;
    return;
  }

  pullInFlight = (async () => {
    try {
      const remote = await pullRemote(userId);
      const localUpdatedAt = await getLocalUpdatedAtMs();
      const remoteUpdatedAt = remote.appState?.updated_at
        ? Date.parse(remote.appState.updated_at)
        : 0;

      if (!remote.appState) {
        await pushAppState();
        return;
      }

      if (remoteUpdatedAt > localUpdatedAt) {
        const merged = remoteToAppState(
          remote.appState,
          remote.interests,
          remote.bookmarks,
          remote.seenCurioIds,
          remote.collections,
        );
        await useAppStore.getState().applySyncedState(merged);
        await setLocalUpdatedAt(remote.appState.updated_at);
        return;
      }

      if (localUpdatedAt > remoteUpdatedAt) {
        await pushAppState();
        return;
      }

      // Timestamps tied — prefer whichever side has more onboarding progress.
      const local = useAppStore.getState();
      const remoteHasProgress =
        remote.appState.has_completed_onboarding || remote.bookmarks.length > 0;
      const localHasProgress =
        local.hasCompletedOnboarding || local.bookmarks.length > 0;

      if (remoteHasProgress && !localHasProgress) {
        const merged = remoteToAppState(
          remote.appState,
          remote.interests,
          remote.bookmarks,
          remote.seenCurioIds,
          remote.collections,
        );
        await useAppStore.getState().applySyncedState(merged);
        await setLocalUpdatedAt(remote.appState.updated_at);
        return;
      }

      if (localHasProgress && !remoteHasProgress) {
        await pushAppState();
      }
    } catch (error) {
      validateSessionAfterAuthFailure(error);
      if (__DEV__) {
        console.warn('[Currio] Cloud sync pull failed:', error);
      }
    }
  })();

  try {
    await pullInFlight;
  } finally {
    pullInFlight = null;
  }
}

/**
 * Push local app state to Supabase (app state, interests, bookmarks, seen).
 */
export async function pushAppState(): Promise<void> {
  if (!isSyncEnabled()) return;

  const userId = getUserId();
  if (!userId) return;

  if (pushInFlight) {
    await pushInFlight;
    return;
  }

  pushInFlight = (async () => {
    try {
      const state = useAppStore.getState();
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('user_app_state')
        .upsert(
          {
            user_id: userId,
            has_completed_onboarding: state.hasCompletedOnboarding,
            has_seen_welcome: state.hasSeenWelcome,
            streak: state.streak,
            last_open_date: state.lastOpenDate,
            theme_mode: state.themeMode,
            todays_curio_id: state.todaysCurioId,
            todays_curio_date: state.todaysCurioDate,
            weekly_digest_enabled: state.weeklyDigestEnabled,
          },
          { onConflict: 'user_id' },
        )
        .select('updated_at')
        .single();

      if (error) throw error;

      await Promise.all([
        pushInterests(userId, state.interests),
        pushBookmarks(userId, state.bookmarks),
        pushSeenCurios(userId, state.seenCurioIds),
        pushCollections(userId, state.collections),
      ]);

      if (data?.updated_at) {
        await setLocalUpdatedAt(data.updated_at);
      }
    } catch (error) {
      validateSessionAfterAuthFailure(error);
      if (__DEV__) {
        console.warn('[Currio] Cloud sync push failed:', error);
      }
    }
  })();

  try {
    await pushInFlight;
  } finally {
    pushInFlight = null;
  }
}

/** Debounced push after local mutations. */
export function schedulePush(): void {
  if (!isSyncEnabled()) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
  }

  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushAppState();
  }, 800);
}

/** Immediate push for onboarding and other critical paths. */
export async function pushNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  await pushAppState();
}
