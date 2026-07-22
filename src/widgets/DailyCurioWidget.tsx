import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { BRAND } from '@/theme/brand';

export const DAILY_CURIO_WIDGET_NAME = 'DailyCurio';

export type DailyCurioWidgetProps = {
  title: string;
  category?: string;
  subtitle?: string;
};

export function DailyCurioWidget({
  title,
  category,
  subtitle = 'Tap to open Currio',
}: DailyCurioWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: BRAND.deep,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="TODAY’S CURRIO"
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: BRAND.lavender,
            letterSpacing: 1.2,
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
        text={category ? `${category}  ·  ${subtitle}` : subtitle}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: BRAND.pale,
        }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
