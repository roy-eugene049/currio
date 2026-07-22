import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

interface WeeklyDigestTileProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  palette: ProfilePalette;
  delay?: number;
}

const PREVIEW_LINES = [
  { icon: 'sparkles-outline' as const, label: '5 curated curios' },
  { icon: 'planet-outline' as const, label: 'Matched to your topics' },
  { icon: 'calendar-outline' as const, label: 'Arrives every Sunday' },
];

export function WeeklyDigestTile({
  enabled,
  onToggle,
  palette,
  delay = 360,
}: WeeklyDigestTileProps) {
  const { isDark } = useTheme();

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(360)} style={styles.wrap}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.tileBg,
            borderColor: enabled
              ? isDark
                ? `${BRAND.lavender}44`
                : `${BRAND.electric}30`
              : palette.tileBorder,
          },
        ]}
      >
        <LinearGradient
          colors={
            enabled
              ? [BRAND.deep, BRAND.electric, BRAND.pale]
              : [BRAND.deepMuted, BRAND.electric]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBand, !enabled && styles.heroBandPaused]}
        >
          <View style={styles.stamp}>
            <Text style={styles.stampText}>SUN</Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroIconDisc}>
              <Ionicons name="mail-open-outline" size={22} color={BRAND.mist} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>INBOX RITUAL</Text>
              <Text style={styles.heroTitle}>Weekly digest</Text>
              <Text style={styles.heroSubtitle}>
                A quiet Sunday letter with five curios worth opening.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(value) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(value);
              }}
              trackColor={{
                false: `${BRAND.mist}55`,
                true: `${BRAND.mist}DD`,
              }}
              thumbColor={enabled ? BRAND.mist : `${BRAND.mist}EE`}
              accessibilityLabel="Weekly digest email"
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: enabled
                    ? isDark
                      ? `${BRAND.electric}33`
                      : `${BRAND.electric}14`
                    : isDark
                      ? `${BRAND.lavender}14`
                      : `${BRAND.electric}08`,
                },
              ]}
            >
              <Ionicons
                name={enabled ? 'checkmark-circle' : 'pause-circle-outline'}
                size={14}
                color={enabled ? '#34D399' : palette.tileSubtitle}
              />
              <Text style={[styles.statusText, { color: palette.tileTitle }]}>
                {enabled ? 'Subscribed' : 'Unsubscribed'}
              </Text>
            </View>
            <Text style={[styles.statusHint, { color: palette.tileSubtitle }]}>
              {enabled ? 'Sent to your account email' : 'No weekly email'}
            </Text>
          </View>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: isDark
                  ? `${BRAND.electric}12`
                  : `${BRAND.electric}07`,
                borderColor: isDark
                  ? `${BRAND.lavender}22`
                  : `${BRAND.electric}14`,
              },
            ]}
          >
            <Text style={[styles.previewEyebrow, { color: palette.tileSubtitle }]}>
              What’s inside
            </Text>
            {PREVIEW_LINES.map((line) => (
              <View key={line.label} style={styles.previewRow}>
                <View
                  style={[
                    styles.previewIcon,
                    {
                      backgroundColor: isDark
                        ? `${BRAND.electric}28`
                        : `${BRAND.lavender}66`,
                    },
                  ]}
                >
                  <Ionicons name={line.icon} size={14} color={BRAND.electric} />
                </View>
                <Text style={[styles.previewLabel, { color: palette.tileTitle }]}>
                  {line.label}
                </Text>
              </View>
            ))}

            <View style={styles.sparkRow}>
              {[0, 1, 2, 3, 4].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.spark,
                    {
                      opacity: enabled ? 1 : 0.45,
                      backgroundColor:
                        index % 2 === 0 ? BRAND.electric : BRAND.lavender,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroBand: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBandPaused: {
    opacity: 0.92,
  },
  stamp: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: `${BRAND.mist}66`,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    backgroundColor: `${BRAND.mist}22`,
  },
  stampText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: BRAND.mist,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 36,
  },
  heroIconDisc: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${BRAND.mist}28`,
    borderWidth: 1,
    borderColor: `${BRAND.mist}40`,
  },
  heroCopy: {
    flex: 1,
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: `${BRAND.mist}CC`,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: `${BRAND.mist}E6`,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusHint: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  previewEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sparkRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  spark: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
});
