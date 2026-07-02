import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StreakBadge } from '@/components/StreakBadge';
import { useTheme } from '@/hooks/useTheme';
import { formatDisplayDate, getGreeting } from '@/utils/date';

interface HomeHeaderProps {
  name: string;
  streak: number;
}

export function HomeHeader({ name, streak }: HomeHeaderProps) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.datePill,
            { backgroundColor: isDark ? '#33415580' : '#FFFFFF90' },
          ]}
        >
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDisplayDate()}
          </Text>
        </View>
        <StreakBadge streak={streak} />
      </View>

      <Text style={[styles.greeting, { color: colors.textMuted }]}>
        {getGreeting()},
      </Text>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>
        Here&apos;s your daily dose of curiosity
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  name: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
  },
});
