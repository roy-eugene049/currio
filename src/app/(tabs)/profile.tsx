import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/CategoryChip';
import { AnimatedTabScreen } from '@/components/navigation/AnimatedTabScreen';
import { getTabBarInset } from '@/components/navigation/FloatingTabBar';
import { LatestSavedCurrioSnapshot } from '@/components/profile/LatestSavedCurrioSnapshot';
import { LearningRemindersTile } from '@/components/profile/LearningRemindersTile';
import { ProfileBentoStat } from '@/components/profile/ProfileBentoStat';
import { ThemeAppearanceSection } from '@/components/profile/ThemeAppearanceSection';
import { WeeklyDigestTile } from '@/components/profile/WeeklyDigestTile';
import { TopicSelector } from '@/components/TopicSelector';
import { APP_VERSION } from '@/constants';
import { ENV } from '@/constants/env';
import { useProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { ReminderTime } from '@/services/reminderService';
import {
  formatNextNudgeLabel,
  nextOccurrenceDate,
} from '@/services/reminderService';
import { BRAND } from '@/theme/brand';
import type { Category, ThemeMode } from '@/types/curio';
import { showActionFeedback } from '@/utils/actionFeedback';
import { getMemberSince, getUserDisplayName, getUserInitials } from '@/utils/user';

function OrbitTile({
  icon,
  title,
  subtitle,
  onPress,
  delay,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  delay: number;
  palette: ReturnType<typeof useProfilePalette>;
}) {
  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420).springify().damping(18)}
      style={[
        styles.orbitTile,
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
        style={styles.orbitAccent}
      />
      <View style={[styles.orbitIconWrap, { backgroundColor: palette.iconWrapBg }]}>
        <Ionicons name={icon} size={20} color={BRAND.electric} />
      </View>
      <View style={styles.orbitCopy}>
        <Text style={[styles.orbitTitle, { color: palette.tileTitle }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.orbitSubtitle, { color: palette.tileSubtitle }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="arrow-forward" size={18} color={palette.tileSubtitle} />
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const palette = useProfilePalette(isDark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const interests = useAppStore((s) => s.interests);
  const themeMode = useAppStore((s) => s.themeMode);
  const learningRemindersEnabled = useAppStore((s) => s.learningRemindersEnabled);
  const learningReminderTimes = useAppStore((s) => s.learningReminderTimes);
  const weeklyDigestEnabled = useAppStore((s) => s.weeklyDigestEnabled);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const streak = useAppStore((s) => s.streak);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setLearningRemindersEnabled = useAppStore((s) => s.setLearningRemindersEnabled);
  const setLearningReminderTimes = useAppStore((s) => s.setLearningReminderTimes);
  const setWeeklyDigestEnabled = useAppStore((s) => s.setWeeklyDigestEnabled);
  const updateInterests = useAppStore((s) => s.updateInterests);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [showInterests, setShowInterests] = useState(false);
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  const [editingInterests, setEditingInterests] = useState<Category[]>([]);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const memberSince = getMemberSince(user);

  const openInterestsEditor = () => {
    setEditingInterests([...interests]);
    setShowInterests(true);
  };

  const toggleInterest = (category: Category) => {
    setEditingInterests((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const saveInterests = async () => {
    if (editingInterests.length >= 1) {
      await updateInterests(editingInterests);
      showActionFeedback('topics');
    }
    setShowInterests(false);
  };

  const handleThemeSelect = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleRemindersToggle = async (enabled: boolean) => {
    const ok = await setLearningRemindersEnabled(enabled);
    if (enabled && !ok) {
      showActionFeedback(
        'error',
        'Enable notifications in Settings to get curiosity nudges.',
      );
      return;
    }
    showActionFeedback(
      'success',
      enabled ? 'Curiosity nudges on' : 'Curiosity nudges off',
    );
  };

  const handleReminderTimesChange = async (times: ReminderTime[]) => {
    const ok = await setLearningReminderTimes(times);
    if (!ok) {
      showActionFeedback(
        'error',
        'Couldn’t schedule that time. Check notification permissions and try again.',
      );
      return;
    }

    const upcoming = [...times]
      .map((time) => ({ time, at: nextOccurrenceDate(time).getTime() }))
      .sort((a, b) => a.at - b.at)[0];

    showActionFeedback(
      'success',
      upcoming
        ? formatNextNudgeLabel(upcoming.time)
        : 'Curiosity nudge times updated',
    );
  };

  const handleDigestToggle = async (enabled: boolean) => {
    await setWeeklyDigestEnabled(enabled);
    showActionFeedback(
      'success',
      enabled ? 'Weekly digest on' : 'Weekly digest off',
    );
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login' as Href);
  };

  return (
    <AnimatedTabScreen tabIndex={1}>
      <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: getTabBarInset(insets.bottom) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(480)}
            style={styles.hero}
          >
            <Text style={[styles.kicker, { color: palette.kicker }]}>YOUR SPACE</Text>
            <View style={styles.heroRow}>
              <View style={styles.avatarTilt}>
                <LinearGradient
                  colors={[BRAND.electric, BRAND.lavender, BRAND.electric]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRing}
                >
                  <View style={[styles.avatar, { backgroundColor: palette.avatarBg }]}>
                    <Text style={[styles.initials, { color: palette.displayName }]}>
                      {initials}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.heroCopyTilt}>
                <Text style={[styles.displayName, { color: palette.displayName }]}>
                  {displayName}
                </Text>
                <Text style={[styles.email, { color: palette.email }]}>
                  {user?.email ?? 'Not signed in'}
                </Text>
                <View
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: palette.memberPillBg,
                      borderColor: palette.memberPillBorder,
                    },
                  ]}
                >
                  <Text style={[styles.memberText, { color: palette.memberText }]}>
                    {memberSince}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.bentoGrid}>
            <ProfileBentoStat
              kind="streak"
              icon="flame"
              value={streak}
              label="Day streak"
              hint={streak === 1 ? 'Keep it going tomorrow' : 'Days reading in a row'}
              large
              tilt="-1.5deg"
              delay={120}
              palette={palette}
              isDark={isDark}
            />
            <View style={styles.bentoStack}>
              <ProfileBentoStat
                kind="saved"
                icon="bookmark"
                value={bookmarks.length}
                label="Saved"
                hint="Your bookmarked currios"
                tilt="1deg"
                delay={200}
                palette={palette}
                isDark={isDark}
                onPress={() => router.push('/bookmarks' as Href)}
              />
              <ProfileBentoStat
                kind="topics"
                icon="sparkles"
                value={interests.length}
                label="Topics"
                hint="Tap to edit interests"
                tilt="-1deg"
                delay={280}
                palette={palette}
                isDark={isDark}
                onPress={openInterestsEditor}
              />
            </View>
          </View>

          <LatestSavedCurrioSnapshot
            palette={palette}
            delay={320}
            onViewAll={() => router.push('/bookmarks' as Href)}
          />

          <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
            {'// look & feel'}
          </Text>
          <ThemeAppearanceSection
            themeMode={themeMode}
            isOpen={showThemeDrawer}
            onToggle={() => setShowThemeDrawer((open) => !open)}
            onSelect={handleThemeSelect}
            palette={palette}
            contentPadding={22}
            delay={240}
          />

          <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
            {'// stay curious'}
          </Text>
          <LearningRemindersTile
            enabled={learningRemindersEnabled}
            times={learningReminderTimes}
            onToggle={handleRemindersToggle}
            onChangeTimes={handleReminderTimesChange}
            palette={palette}
            delay={300}
          />
          <WeeklyDigestTile
            enabled={weeklyDigestEnabled}
            onToggle={handleDigestToggle}
            palette={palette}
            delay={340}
          />

          <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
            About
          </Text>
          <OrbitTile
            icon="sparkles-outline"
            title="About Currio"
            subtitle="Learn something new every day"
            delay={460}
            palette={palette}
          />
          <OrbitTile
            icon="code-slash-outline"
            title="Version"
            subtitle={APP_VERSION}
            delay={520}
            palette={palette}
          />
          {ENV.isSupabaseConfigured ? (
            <OrbitTile
              icon="log-out-outline"
              title="Sign Out"
              subtitle={isAuthLoading ? 'Signing out…' : 'End your session'}
              onPress={handleSignOut}
              delay={580}
              palette={palette}
            />
          ) : null}

          {interests.length > 0 ? (
            <>
              <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
                Your topics
              </Text>
              <Animated.View
                entering={FadeInDown.delay(120).duration(400)}
                style={styles.chips}
              >
                {interests.map((category) => (
                  <CategoryChip key={category} category={category} size="sm" />
                ))}
              </Animated.View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showInterests}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInterests(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowInterests(false)}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Interests</Text>
            <Pressable onPress={saveInterests}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <TopicSelector selected={editingInterests} onToggle={toggleInterest} />
          </View>
        </SafeAreaView>
      </Modal>
      </View>
    </AnimatedTabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  hero: {
    marginBottom: 24,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatarTilt: {
    transform: [{ rotate: '-6deg' }],
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
  },
  avatar: {
    flex: 1,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroCopyTilt: {
    flex: 1,
    transform: [{ rotate: '1deg' }],
  },
  displayName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    marginBottom: 10,
  },
  memberPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  memberText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bentoGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 28,
  },
  bentoStack: {
    flex: 1,
    gap: 12,
  },
  sectionTag: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 12,
    marginTop: 8,
  },
  orbitTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  orbitAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  orbitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCopy: {
    flex: 1,
  },
  orbitTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  orbitSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
