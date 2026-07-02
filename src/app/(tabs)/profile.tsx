import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

function BentoStat({
  icon,
  value,
  label,
  large,
  tilt,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  large?: boolean;
  tilt: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500).springify().damping(16)}
      style={[styles.bentoCell, large && styles.bentoLarge, { transform: [{ rotate: tilt }] }]}
    >
      <LinearGradient
        colors={[`${BRAND.electric}44`, `${BRAND.lavender}18`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bentoBorder}
      >
        <BlurView intensity={40} tint="dark" style={styles.bentoBlur}>
          <View style={styles.bentoInner}>
            <Ionicons name={icon} size={large ? 28 : 22} color={BRAND.lavender} />
            <Text style={styles.bentoValue}>{value}</Text>
            <Text style={styles.bentoLabel}>{label}</Text>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  delay: number;
}) {
  const content = (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={styles.orbitTile}>
      <LinearGradient
        colors={[`${BRAND.lavender}33`, `${BRAND.electric}22`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.orbitAccent}
      />
      <View style={styles.orbitIconWrap}>
        <Ionicons name={icon} size={20} color={BRAND.electric} />
      </View>
      <View style={styles.orbitCopy}>
        <Text style={styles.orbitTitle}>{title}</Text>
        {subtitle ? <Text style={styles.orbitSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <Ionicons name="arrow-forward" size={18} color={`${BRAND.lavender}99`} />
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
  const { colors } = useTheme();
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
    <View style={styles.root}>
      <LinearGradient
        colors={[BRAND.deep, '#1E0040', BRAND.deepMuted]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: getTabBarInset(insets.bottom) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
            <Text style={styles.kicker}>YOUR SPACE</Text>
            <View style={styles.heroRow}>
              <LinearGradient
                colors={[BRAND.electric, BRAND.lavender, BRAND.electric]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
              </LinearGradient>

              <View style={styles.heroCopy}>
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.email}>{user?.email ?? 'Not signed in'}</Text>
                <View style={styles.memberPill}>
                  <Text style={styles.memberText}>since {memberSince}</Text>
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
            />
            <View style={styles.bentoStack}>
              <BentoStat
                icon="bookmark"
                value={bookmarks.length}
                label="saved"
                tilt="2deg"
                delay={200}
              />
              <BentoStat
                icon="heart"
                value={interests.length}
                label="topics"
                tilt="-2deg"
                delay={280}
              />
            </View>
          </View>

          <Text style={styles.sectionTag}>{'// preferences'}</Text>
          <OrbitTile
            icon="heart-outline"
            title="Interests"
            subtitle={`${interests.length} topics in orbit`}
            onPress={openInterestsEditor}
            delay={340}
          />
          <OrbitTile
            icon="moon-outline"
            title="Appearance"
            subtitle={themeLabel}
            onPress={cycleTheme}
            delay={400}
          />

          <Text style={styles.sectionTag}>{'// about'}</Text>
          <OrbitTile
            icon="sparkles-outline"
            title="About Currio"
            subtitle="Learn something new every day"
            delay={460}
          />
          <OrbitTile icon="code-slash-outline" title="Version" subtitle={APP_VERSION} delay={520} />
          {ENV.isSupabaseConfigured ? (
            <OrbitTile
              icon="log-out-outline"
              title="Sign Out"
              subtitle={isAuthLoading ? 'Signing out…' : 'End your session'}
              onPress={handleSignOut}
              delay={580}
            />
          ) : null}

          {interests.length > 0 ? (
            <>
              <Text style={styles.sectionTag}>{'// orbit'}</Text>
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
    backgroundColor: BRAND.deep,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND.electric,
    opacity: 0.12,
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
    opacity: 0.08,
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
    color: `${BRAND.lavender}99`,
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
    backgroundColor: BRAND.deepMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 30,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -1,
  },
  heroCopy: {
    flex: 1,
    transform: [{ rotate: '1deg' }],
  },
  displayName: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: `${BRAND.lavender}BB`,
    marginBottom: 10,
  },
  memberPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: `${BRAND.electric}33`,
    borderWidth: 1,
    borderColor: `${BRAND.lavender}44`,
  },
  memberText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.lavender,
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
    backgroundColor: `${BRAND.deep}AA`,
  },
  bentoValue: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -1,
    marginTop: 8,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: `${BRAND.lavender}CC`,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: `${BRAND.electric}CC`,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: undefined,
  },
  orbitTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: `${BRAND.deepMuted}CC`,
    borderWidth: 1,
    borderColor: `${BRAND.lavender}22`,
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
    backgroundColor: `${BRAND.electric}22`,
    transform: [{ rotate: '-8deg' }],
  },
  orbitCopy: {
    flex: 1,
  },
  orbitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.mist,
  },
  orbitSubtitle: {
    fontSize: 13,
    color: `${BRAND.lavender}AA`,
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
