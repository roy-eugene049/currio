import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { BRAND } from '@/theme/brand';

export const DAILY_CURIO_WIDGET_NAME = 'DailyCurio';

export type DailyCurioWidgetProps = {
  title: string;
  category?: string;
  streak?: number;
  /** Footer line: next nudge or active nudge copy */
  footer?: string;
  /** When a scheduled reminder is in its active window */
  nudgeActive?: boolean;
};

export function DailyCurioWidget({
  title,
  category,
  streak = 0,
  footer,
  nudgeActive = false,
}: DailyCurioWidgetProps) {
  const streakLabel = streak > 0 ? `${streak} day streak` : 'Start a streak';
  const footerText =
    footer ??
    (category ? `${category}  ·  Tap to open` : 'Tap to open Currio');

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: nudgeActive ? BRAND.deepMuted : BRAND.deep,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={nudgeActive ? 'CURIOSITY NUDGE' : 'TODAY’S CURRIO'}
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: nudgeActive ? BRAND.mist : BRAND.lavender,
            letterSpacing: 1.2,
          }}
        />
        <TextWidget
          text={streakLabel}
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: BRAND.pale,
          }}
        />
      </FlexWidget>

      <TextWidget
        text={title}
        style={{
          fontSize: 18,
          fontWeight: '800',
          color: BRAND.mist,
          marginBottom: 10,
        }}
        maxLines={3}
      />

      <TextWidget
        text={footerText}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: nudgeActive ? BRAND.lavender : BRAND.pale,
        }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
