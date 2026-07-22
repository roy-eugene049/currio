import { Platform } from 'react-native';
import {
  registerWidgetTaskHandler,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';

import {
  fallbackWidgetCopy,
  readWidgetCurioSnapshot,
} from '@/services/widgetService';

import {
  DAILY_CURIO_WIDGET_NAME,
  DailyCurioWidget,
} from './DailyCurioWidget';

async function renderDailyCurioWidget(
  renderWidget: WidgetTaskHandlerProps['renderWidget'],
) {
  const snapshot = await readWidgetCurioSnapshot();
  const fallback = fallbackWidgetCopy();
  renderWidget(
    <DailyCurioWidget
      title={snapshot?.title ?? fallback.title}
      category={snapshot?.category ?? fallback.category}
    />,
  );
}

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== DAILY_CURIO_WIDGET_NAME) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderDailyCurioWidget(props.renderWidget);
      break;
    case 'WIDGET_CLICK':
      // OPEN_APP is handled natively; nothing else to do.
      break;
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

export function registerDailyCurioWidgetTaskHandler() {
  if (Platform.OS !== 'android') return;
  registerWidgetTaskHandler(widgetTaskHandler);
}
