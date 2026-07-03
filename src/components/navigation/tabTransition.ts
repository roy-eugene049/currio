import {
  Easing,
  makeMutable,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated';

export const TAB_WIDTH = 72;
export const TAB_TRANSITION_MS = 240;
export const TAB_TRANSITION_EASING = Easing.bezier(0.25, 1, 0.4, 1);

export const tabProgress = makeMutable(1);
export const tabDirection = makeMutable(1);
export const tabActiveIndex = makeMutable(0);

let committedTabIndex = 0;

export function getCommittedTabIndex(): number {
  return committedTabIndex;
}

export function syncTabIndex(index: number): void {
  committedTabIndex = index;
  tabActiveIndex.value = index;
  tabProgress.value = 1;
}

/** Start a coordinated tab transition (screen + dock indicator). */
export function beginTabTransition(
  nextIndex: number,
  indicatorX?: SharedValue<number>,
): void {
  if (nextIndex === committedTabIndex) return;

  tabDirection.value = nextIndex > committedTabIndex ? 1 : -1;
  tabActiveIndex.value = nextIndex;
  committedTabIndex = nextIndex;

  tabProgress.value = 0;
  tabProgress.value = withTiming(1, {
    duration: TAB_TRANSITION_MS,
    easing: TAB_TRANSITION_EASING,
  });

  if (indicatorX) {
    indicatorX.value = withTiming(nextIndex * TAB_WIDTH, {
      duration: TAB_TRANSITION_MS,
      easing: TAB_TRANSITION_EASING,
    });
  }
}

export const TAB_ROUTE_INDEX: Record<string, number> = {
  index: 0,
  profile: 1,
};
