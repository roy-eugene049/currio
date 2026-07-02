import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { neumorphicInset, neumorphicRaised } from '@/theme/neumorphic';

interface NeumorphicSurfaceProps extends ViewProps {
  inset?: boolean;
  radius?: number;
}

export function NeumorphicSurface({
  inset = false,
  radius = 24,
  style,
  children,
  ...rest
}: NeumorphicSurfaceProps) {
  const { isDark } = useTheme();
  const surfaceStyle = inset
    ? neumorphicInset(isDark, radius)
    : neumorphicRaised(isDark, radius);

  return (
    <View style={[surfaceStyle, style]} {...rest}>
      {children}
    </View>
  );
}

export const neumorphicStyles = StyleSheet.create({
  circleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
