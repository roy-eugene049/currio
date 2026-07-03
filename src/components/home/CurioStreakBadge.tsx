import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { STREAK } from '@/theme/streak';

interface CurioStreakBadgeProps {
  streak: number;
}

export function CurioStreakBadge({ streak }: CurioStreakBadgeProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? STREAK.bgDark : STREAK.bg,
          borderColor: isDark ? STREAK.borderDark : STREAK.border,
        },
      ]}
    >
      <Ionicons
        name="flame"
        size={17}
        color={isDark ? STREAK.flameLight : STREAK.flame}
      />
      <Text
        style={[
          styles.count,
          { color: isDark ? STREAK.textOnDark : STREAK.text },
        ]}
      >
        {streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 56,
    borderRadius: 20,
    borderWidth: 1,
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
