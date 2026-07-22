import { STORAGE_KEYS } from '@/constants';
import { getSecureItem, setSecureItem } from '@/services/storage';
import type { Curio } from '@/types/curio';

/** Offer a curiosity check every N unique curios opened. */
export const CHALLENGE_INTERVAL = 3;

type ChallengePersist = {
  wins: number;
};

/** In-memory session — resets when the JS process restarts. */
let sessionCurios: Curio[] = [];
/** Session index after which the last challenge was offered. */
let lastOfferedAtCount = 0;
let challengePending = false;

function defaultPersist(): ChallengePersist {
  return { wins: 0 };
}

async function readPersist(): Promise<ChallengePersist> {
  const raw = await getSecureItem(STORAGE_KEYS.CHALLENGE_STATE);
  if (!raw) return defaultPersist();
  try {
    const parsed = JSON.parse(raw) as Partial<ChallengePersist> & {
      lastChallengeDate?: string | null;
    };
    return {
      wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
    };
  } catch {
    return defaultPersist();
  }
}

async function writePersist(state: ChallengePersist): Promise<void> {
  await setSecureItem(STORAGE_KEYS.CHALLENGE_STATE, JSON.stringify(state));
}

function curiosSinceLastOffer(): number {
  return Math.max(0, sessionCurios.length - lastOfferedAtCount);
}

/** Record a curio the user opened. Does not open the sheet. */
export function recordSessionCurio(curio: Curio): number {
  if (!sessionCurios.some((item) => item.id === curio.id)) {
    sessionCurios = [...sessionCurios, curio];
  }
  if (curiosSinceLastOffer() >= CHALLENGE_INTERVAL) {
    challengePending = true;
  }
  return sessionCurios.length;
}

export function getSessionCurios(): Curio[] {
  return sessionCurios;
}

/** Curios in the current interval window (since last challenge). */
export function getIntervalCurios(): Curio[] {
  return sessionCurios.slice(lastOfferedAtCount);
}

export function getSessionCuriosViewed(): number {
  return sessionCurios.length;
}

/**
 * True when ≥ CHALLENGE_INTERVAL curios have been read since the last
 * challenge, and a check is waiting to show on the next shuffle.
 */
export async function shouldOfferChallengeOnNext(): Promise<boolean> {
  if (!challengePending) return false;
  return curiosSinceLastOffer() >= CHALLENGE_INTERVAL;
}

export function clearChallengePending(): void {
  challengePending = false;
}

export async function markChallengeOffered(): Promise<void> {
  challengePending = false;
  lastOfferedAtCount = sessionCurios.length;
}

export async function recordChallengeWin(): Promise<number> {
  challengePending = false;
  lastOfferedAtCount = sessionCurios.length;
  const state = await readPersist();
  const wins = state.wins + 1;
  await writePersist({ wins });
  return wins;
}

export async function getChallengeWins(): Promise<number> {
  const state = await readPersist();
  return state.wins;
}

/** @deprecated */
export const CURIOS_BEFORE_CHALLENGE = CHALLENGE_INTERVAL;

/** @deprecated use recordSessionCurio */
export function recordSessionCurioViewed(): number {
  return sessionCurios.length;
}

/** @deprecated use shouldOfferChallengeOnNext */
export async function canOfferChallenge(): Promise<boolean> {
  return shouldOfferChallengeOnNext();
}
