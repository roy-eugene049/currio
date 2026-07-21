import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareCurioButton } from '@/components/share/ShareCurioButton';
import { CATEGORY_ICONS } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import type { Curio } from '@/types/curio';

interface CurioHeroCardProps {
  curio: Curio;
  delay?: number;
}

export function CurioHeroCard({ curio, delay = 0 }: CurioHeroCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(650).springify().damping(18)}
      style={[
        styles.outer,
        {
          shadowColor: isDark ? '#000' : '#4F46E5',
          shadowOpacity: isDark ? 0.35 : 0.12,
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#312E81', '#1E293B'] : ['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons
                name={CATEGORY_ICONS[curio.category] as keyof typeof Ionicons.glyphMap}
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {curio.category}
              </Text>
            </View>
            <View style={styles.actions}>
              <BookmarkButton curioId={curio.id} size={22} />
              <ShareCurioButton curio={curio} color={colors.textMuted} size={22} hitSlop={12} />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>TODAY&apos;S CURRIO</Text>
          <Text style={[styles.title, { color: colors.text }]}>{curio.title}</Text>

          <View
            style={[
              styles.visual,
              { backgroundColor: isDark ? '#334155' : `${colors.primary}10` },
            ]}
          >
            <LinearGradient
              colors={[`${colors.primary}20`, `${colors.accent}15`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="sparkles" size={32} color={colors.primary} style={{ opacity: 0.7 }} />
          </View>

          <Text style={[styles.content, { color: colors.textMuted }]}>{curio.content}</Text>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.readTime}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                {curio.readingTime} read
              </Text>
            </View>
            <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
              Pull down to refresh
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
  },
  gradientBorder: {
    borderRadius: 28,
    padding: 2,
  },
  card: {
    borderRadius: 26,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  visual: {
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 27,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readTimeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  swipeHint: {
    fontSize: 12,
  },
});
