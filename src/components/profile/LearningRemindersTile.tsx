import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { LEARNING_REMINDER_LABEL } from '@/services/reminderService';
import { BRAND } from '@/theme/brand';

interface LearningRemindersTileProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  palette: ProfilePalette;
  delay?: number;
}

export function LearningRemindersTile({
  enabled,
  onToggle,
  palette,
  delay = 320,
}: LearningRemindersTileProps) {
  const { isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(300)}
      style={styles.wrap}
    >
      <View
        style={[
          styles.tile,
          {
            backgroundColor: palette.tileBg,
            borderColor: palette.tileBorder,
          },
        ]}
      >
        <LinearGradient
          colors={palette.tileAccent}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.accent}
        />
        <View style={[styles.iconWrap, { backgroundColor: palette.iconWrapBg }]}>
          <Ionicons name="notifications-outline" size={20} color={BRAND.electric} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.tileTitle }]}>
            Learning reminders
          </Text>
          <Text style={[styles.subtitle, { color: palette.tileSubtitle }]}>
            {enabled ? LEARNING_REMINDER_LABEL : 'Off — turn on to stay curious'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: isDark ? `${BRAND.lavender}33` : `${BRAND.electric}22`,
            true: BRAND.electric,
          }}
          thumbColor={BRAND.mist}
          accessibilityLabel="Learning reminders"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
