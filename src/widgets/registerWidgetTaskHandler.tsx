import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import {
  buildWidgetViewModel,
  readWidgetCurioSnapshot,
} from '@/services/widgetService';

import {
  DAILY_CURIO_WIDGET_NAME,
  DailyCurioWidget,
} from './DailyCurioWidget';

export function registerDailyCurioWidgetTaskHandler() {
  // Native widget module is unavailable in Expo Go.
  if (Platform.OS !== 'android' || isRunningInExpoGo()) return;

  void import('react-native-android-widget').then(
    ({ registerWidgetTaskHandler }) => {
      registerWidgetTaskHandler(async (props) => {
        if (props.widgetInfo.widgetName !== DAILY_CURIO_WIDGET_NAME) return;

        switch (props.widgetAction) {
          case 'WIDGET_ADDED':
          case 'WIDGET_UPDATE':
          case 'WIDGET_RESIZED': {
            const snapshot = await readWidgetCurioSnapshot();
            const view = buildWidgetViewModel(snapshot);
            props.renderWidget(
              <DailyCurioWidget
                title={view.title}
                category={view.category}
                streak={view.streak}
                footer={view.footer}
                nudgeActive={view.nudgeActive}
              />,
            );
            break;
          }
          case 'WIDGET_CLICK':
          case 'WIDGET_DELETED':
          default:
            break;
        }
      });
    },
  );
}
