import * as Haptics from 'expo-haptics';

import { useToastStore, type FeedbackVariant } from '@/store/useToastStore';

type ActionKind = 'bookmark' | 'bookmark-removed' | 'topics' | 'success' | 'error';

const PRESETS: Record<
  Exclude<ActionKind, 'error' | 'success'>,
  { message: string; variant: FeedbackVariant }
> = {
  bookmark: {
    message: 'Saved for later',
    variant: 'bookmark',
  },
  'bookmark-removed': {
    message: 'Removed from saves',
    variant: 'bookmark',
  },
  topics: {
    message: 'Topics saved',
    variant: 'topics',
  },
};

async function playHaptic(kind: ActionKind): Promise<void> {
  try {
    if (kind === 'bookmark' || kind === 'topics' || kind === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (kind === 'bookmark-removed') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics unavailable on some devices/simulators
  }
}

export function showActionFeedback(
  kind: ActionKind,
  messageOverride?: string,
): void {
  const preset = PRESETS[kind as keyof typeof PRESETS];
  const message =
    messageOverride ??
    preset?.message ??
    (kind === 'error' ? 'Something went wrong' : 'Done');

  const variant: FeedbackVariant =
    preset?.variant ?? (kind === 'error' ? 'error' : 'success');

  void playHaptic(kind);
  useToastStore.getState().show(message, { variant });
}
