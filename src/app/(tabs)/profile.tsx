import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/CategoryChip';
import { getTabBarInset } from '@/components/navigation/FloatingTabBar';
import { TopicSelector } from '@/components/TopicSelector';
import { APP_VERSION } from '@/constants';
import { ENV } from '@/constants/env';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { BRAND } from '@/theme/brand';
import type { Category, ThemeMode } from '@/types/curio';
import { getMemberSince, getUserDisplayName, getUserInitials } from '@/utils/user';

type ProfilePalette = {
  gradient: [string, string, string];
  orbOpacity: number;
  kicker: string;
  displayName: string;
  email: string;
  avatarBg: string;
  memberPillBg: string;
  memberPillBorder: string;
  memberText: string;
  bentoBorder: [string, string];
  bentoInner: string;
  bentoIcon: string;
  bentoValue: string;
  bentoLabel: string;
  sectionTag: string;
  tileBg: string;
  tileBorder: string;
  tileTitle: string;
  tileSubtitle: string;
  tileAccent: [string, string];
  iconWrapBg: string;
  blurTint: 'light' | 'dark';
};

function useProfilePalette(isDark: boolean): ProfilePalette {
  return useMemo(
    () =>
      isDark
        ? {
            gradient: [BRAND.deep, '#1E0040', BRAND.deepMuted],
            orbOpacity: 0.12,
            kicker: `${BRAND.lavender}99`,
            displayName: BRAND.mist,
            email: `${BRAND.lavender}BB`,
            avatarBg: BRAND.deepMuted,
            memberPillBg: `${BRAND.electric}33`,
            memberPillBorder: `${BRAND.lavender}44`,
            memberText: BRAND.lavender,
            bentoBorder: [`${BRAND.electric}44`, `${BRAND.lavender}18`],
            bentoInner: `${BRAND.deep}AA`,
            bentoIcon: BRAND.lavender,
            bentoValue: BRAND.mist,
            bentoLabel: `${BRAND.lavender}CC`,
            sectionTag: `${BRAND.electric}CC`,
            tileBg: `${BRAND.deepMuted}CC`,
            tileBorder: `${BRAND.lavender}22`,
            tileTitle: BRAND.mist,
            tileSubtitle: `${BRAND.lavender}AA`,
            tileAccent: [`${BRAND.lavender}33`, `${BRAND.electric}22`],
            iconWrapBg: `${BRAND.electric}22`,
            blurTint: 'dark',
          }
        : {
            gradient: [BRAND.mist, '#F5E8F8', '#EDE0F5'],
            orbOpacity: 0.1,
            kicker: `${BRAND.deep}88`,
            displayName: BRAND.deep,
            email: `${BRAND.deep}99`,
            avatarBg: '#FFFFFF',
            memberPillBg: `${BRAND.electric}18`,
            memberPillBorder: `${BRAND.electric}33`,
            memberText: BRAND.deep,
            bentoBorder: [`${BRAND.electric}33`, `${BRAND.lavender}40`],
            bentoInner: '#FFFFFFDD',
            bentoIcon: BRAND.electric,
            bentoValue: BRAND.deep,
            bentoLabel: `${BRAND.deep}99`,
            sectionTag: BRAND.electric,
            tileBg: '#FFFFFFEE',
            tileBorder: `${BRAND.electric}22`,
            tileTitle: BRAND.deep,
            tileSubtitle: `${BRAND.deep}99`,
            tileAccent: [`${BRAND.lavender}55`, `${BRAND.electric}18`],
            iconWrapBg: `${BRAND.electric}14`,
            blurTint: 'light',
          },
    [isDark],
  );
}

function BentoStat({
  icon,
  value,
  label,
  large,
  tilt,
  delay,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  large?: boolean;
  tilt: string;
  delay: number;
  palette: ProfilePalette;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500).springify().damping(16)}
      style={[styles.bentoCell, large && styles.bentoLarge, { transform: [{ rotate: tilt }] }]}
    >
      <LinearGradient
        colors={palette.bentoBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bentoBorder}
      >
        <BlurView intensity={40} tint={palette.blurTint} style={styles.bentoBlur}>
          <View style={[styles.bentoInner, { backgroundColor: palette.bentoInner }]}>
            <Ionicons name={icon} size={large ? 28 : 22} color={palette.bentoIcon} />
            <Text style={[styles.bentoValue, { color: palette.bentoValue }]}>{value}</Text>
            <Text style={[styles.bentoLabel, { color: palette.bentoLabel }]}>{label}</Text>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

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
  palette: ProfilePalette;
}) {
  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450)}
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
  const bookmarks = useAppStore((s) => s.bookmarks);
  const streak = useAppStore((s) => s.streak);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const updateInterests = useAppStore((s) => s.updateInterests);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [showInterests, setShowInterests] = useState(false);
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
    }
    setShowInterests(false);
  };

  const cycleTheme = async () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const next = modes[(modes.indexOf(themeMode) + 1) % modes.length];
    await setThemeMode(next);
  };

  const themeLabel =
    themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login' as Href);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={palette.gradient}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.orb,
          styles.orbOne,
          { opacity: palette.orbOpacity },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbTwo,
          { opacity: palette.orbOpacity * 0.7 },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: getTabBarInset(insets.bottom) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
            <Text style={[styles.kicker, { color: palette.kicker }]}>YOUR SPACE</Text>
            <View style={styles.heroRow}>
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

              <View style={styles.heroCopy}>
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
                    since {memberSince}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.bentoGrid}>
            <BentoStat
              icon="flame"
              value={streak}
              label="day streak"
              large
              tilt="-3deg"
              delay={120}
              palette={palette}
            />
            <View style={styles.bentoStack}>
              <BentoStat
                icon="bookmark"
                value={bookmarks.length}
                label="saved"
                tilt="2deg"
                delay={200}
                palette={palette}
              />
              <BentoStat
                icon="heart"
                value={interests.length}
                label="topics"
                tilt="-2deg"
                delay={280}
                palette={palette}
              />
            </View>
          </View>

          <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
            {'// preferences'}
          </Text>
          <OrbitTile
            icon="heart-outline"
            title="Interests"
            subtitle={`${interests.length} topics in orbit`}
            onPress={openInterestsEditor}
            delay={340}
            palette={palette}
          />
          <OrbitTile
            icon="moon-outline"
            title="Appearance"
            subtitle={themeLabel}
            onPress={cycleTheme}
            delay={400}
            palette={palette}
          />

          <Text style={[styles.sectionTag, { color: palette.sectionTag }]}>
            {'// about'}
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
                {'// orbit'}
              </Text>
              <View style={styles.chips}>
                {interests.map((category) => (
                  <CategoryChip key={category} category={category} size="sm" />
                ))}
              </View>
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND.electric,
  },
  orbOne: {
    width: 220,
    height: 220,
    top: -60,
    right: -50,
  },
  orbTwo: {
    width: 160,
    height: 160,
    bottom: 180,
    left: -70,
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  hero: {
    marginBottom: 28,
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
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    transform: [{ rotate: '-6deg' }],
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
  heroCopy: {
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
    gap: 12,
    marginBottom: 32,
    minHeight: 168,
  },
  bentoStack: {
    flex: 1,
    gap: 12,
  },
  bentoCell: {
    flex: 1,
  },
  bentoLarge: {
    flex: 1.1,
  },
  bentoBorder: {
    flex: 1,
    borderRadius: 22,
    padding: 1,
  },
  bentoBlur: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
  },
  bentoInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  bentoValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 8,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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
    transform: [{ rotate: '-8deg' }],
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
