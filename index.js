import 'expo-router/entry';

// Android home widget headless task (no-op on other platforms).
import { registerDailyCurioWidgetTaskHandler } from './src/widgets/registerWidgetTaskHandler';

registerDailyCurioWidgetTaskHandler();
