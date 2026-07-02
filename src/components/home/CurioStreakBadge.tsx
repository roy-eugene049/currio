import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';

import { AppChromeChip } from '@/components/ui/AppChromeChip';
import { useTheme } from '@/hooks/useTheme';

interface CurioStreakBadgeProps {
  streak: number;
}

export function CurioStreakBadge({ streak }: CurioStreakBadgeProps) {
  const { colors } = useTheme();

  return (
    <AppChromeChip style={styles.badge}>
      <Ionicons name="flame" size={17} color={colors.icon} />
      <Text style={[styles.count, { color: colors.icon }]}>{streak}</Text>
    </AppChromeChip>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 56,
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
