import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { CategoryTheme } from '@/theme/categoryThemes';

interface GlassChipProps {
  theme: CategoryTheme;
  children: ReactNode;
  style?: ViewStyle;
}

export function GlassChip({ theme, children, style }: GlassChipProps) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: theme.glassBg,
          borderColor: theme.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
