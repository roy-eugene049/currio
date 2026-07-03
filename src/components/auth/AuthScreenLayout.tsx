import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { CurrioLogo } from '@/components/CurrioLogo';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutProps) {
  const { colors, isDark, light } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? [colors.gradientScreen[0], colors.gradientScreen[1], colors.gradientScreen[2]]
            : [...light.gradient.auth]
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbOne, { opacity: isDark ? 0.14 : 0.1 }]} />
      <View style={[styles.orb, styles.orbTwo, { opacity: isDark ? 0.1 : 0.07 }]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <CurrioLogo size={72} color={colors.primary} animate={false} />
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? `${BRAND.deepMuted}EE` : colors.card,
                  borderColor: isDark ? `${BRAND.lavender}22` : colors.borderStrong,
                },
              ]}
            >
              {children}
            </View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    width: 200,
    height: 200,
    top: -70,
    right: -50,
  },
  orbTwo: {
    width: 140,
    height: 140,
    bottom: 80,
    left: -50,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
    maxWidth: 320,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    borderWidth: 1,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
