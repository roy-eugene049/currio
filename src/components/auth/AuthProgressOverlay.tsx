import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

interface AuthProgressOverlayProps {
  title: string;
  message?: string;
}

export function AuthProgressOverlay({ title, message }: AuthProgressOverlayProps) {
  const { isDark } = useTheme();
  const surface = isDark ? `${BRAND.deepMuted}F7` : '#FFF9FFF7';
  const titleColor = isDark ? BRAND.mist : BRAND.deep;
  const messageColor = isDark ? `${BRAND.lavender}D9` : '#6C3A96';

  return (
    <View
      pointerEvents="auto"
      style={[
        styles.overlay,
        { backgroundColor: isDark ? `${BRAND.deep}E8` : `${BRAND.mist}E8` },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? [`${BRAND.lavender}55`, `${BRAND.electric}33`, `${BRAND.deepMuted}88`]
            : [`${BRAND.lavender}99`, `${BRAND.mint}`, `${BRAND.electric}22`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={[styles.card, { backgroundColor: surface }]}>
          <View style={styles.indicatorWrap}>
            <LinearGradient
              colors={
                isDark
                  ? [`${BRAND.electric}66`, `${BRAND.lavender}33`]
                  : [`${BRAND.lavender}80`, `${BRAND.mint}`]
              }
              style={styles.indicatorAura}
            />
            <View style={[styles.iconDisc, { backgroundColor: isDark ? BRAND.deep : BRAND.mist }]}>
              <Ionicons name="sparkles" size={18} color={BRAND.electric} />
            </View>
            <ActivityIndicator
              size="small"
              color={isDark ? BRAND.lavender : BRAND.electric}
              style={styles.spinner}
            />
          </View>

          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          {message ? (
            <Text
              style={[
                styles.message,
                { color: messageColor },
              ]}
            >
              {message}
            </Text>
          ) : null}

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? `${BRAND.lavender}22` : `${BRAND.lavender}3D` },
            ]}
          >
            <LinearGradient
              colors={[BRAND.lavender, BRAND.electric]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.progressFill}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 20,
  },
  card: {
    alignItems: 'center',
    borderRadius: 27,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
  },
  cardBorder: {
    width: '100%',
    maxWidth: 286,
    borderRadius: 28,
    padding: 1.4,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  indicatorWrap: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  indicatorAura: {
    ...StyleSheet.absoluteFill,
    borderRadius: 33,
  },
  iconDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
    width: 66,
    height: 66,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  progressTrack: {
    width: 88,
    height: 4,
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    width: '58%',
    height: '100%',
    borderRadius: 999,
  },
});
