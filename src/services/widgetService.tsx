import { DAILY_CURIO_WIDGET_NAME, DailyCurioWidget } from '@/widgets/DailyCurioWidget';
import { getSecureItem, setSecureItem } from '@/services/storage';
import { BRAND } from '@/theme/brand';
import type { Category } from '@/types/curio';

const WIDGET_SNAPSHOT_KEY = 'currio_widget_daily_curio';

export type WidgetCurioSnapshot = {
  id: string;
  title: string;
  category: Category | string;
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

/** Push today’s curio onto any installed Android home widgets. */
export async function syncDailyCurioWidget(input: {
  id: string;
  title: string;
  category: Category | string;
}): Promise<void> {
  await writeWidgetCurioSnapshot(input);

  // Avoid importing the native module on iOS / web.
  const { Platform } = await import('react-native');
  if (Platform.OS !== 'android') return;

  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    await requestWidgetUpdate({
      widgetName: DAILY_CURIO_WIDGET_NAME,
      renderWidget: () => (
        <DailyCurioWidget title={input.title} category={String(input.category)} />
      ),
      widgetNotFound: () => {
        // No widget on the home screen yet — snapshot is still saved for when one is added.
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[Currio] Widget update skipped', error);
    }
  }
}

export function fallbackWidgetCopy() {
  return {
    title: 'Open Currio for today’s curiosity',
    category: 'Currio',
    accent: BRAND.electric,
  };
}
