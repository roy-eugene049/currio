import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface AppChromeChipProps {
  children: ReactNode;
  style?: ViewStyle;
}

/** Fixed app-brand chrome — does not inherit category colors. */
export function AppChromeChip({ children, style }: AppChromeChipProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.chrome,
          borderColor: colors.chromeBorder,
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
