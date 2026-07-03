import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import type { ProfilePalette } from '@/hooks/useProfilePalette';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';
import type { ThemeMode } from '@/types/curio';

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const OPTION_GAP = 8;
const SCREEN_EDGE_INSET = 16;

interface ThemeAppearanceSectionProps {
  themeMode: ThemeMode;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (mode: ThemeMode) => void;
  palette: ProfilePalette;
  contentPadding?: number;
  delay?: number;
}

function themeLabel(mode: ThemeMode) {
  if (mode === 'system') return 'System';
  if (mode === 'light') return 'Light';
  return 'Dark';
}

export function ThemeAppearanceSection({
  themeMode,
  isOpen,
  onToggle,
  onSelect,
  palette,
  contentPadding = 22,
  delay = 400,
}: ThemeAppearanceSectionProps) {
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const rowWidth = screenWidth - SCREEN_EDGE_INSET * 2;
  const optionWidth =
    (rowWidth - OPTION_GAP * (THEME_OPTIONS.length - 1)) / THEME_OPTIONS.length;

  return (
    <Animated.View layout={LinearTransition.duration(200)} style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <Animated.View
          entering={FadeIn.delay(delay).duration(300)}
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
            <Ionicons name="moon-outline" size={20} color={BRAND.electric} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: palette.tileTitle }]}>Appearance</Text>
            <Text style={[styles.subtitle, { color: palette.tileSubtitle }]}>
              {themeLabel(themeMode)}
            </Text>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={palette.tileSubtitle}
          />
        </Animated.View>
      </Pressable>

      {isOpen ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={[
            styles.dropdownWrap,
            {
              width: screenWidth,
              marginLeft: -contentPadding,
              paddingHorizontal: SCREEN_EDGE_INSET,
            },
          ]}
        >
          <View style={[styles.dropdownRow, { width: rowWidth, gap: OPTION_GAP }]}>
            {THEME_OPTIONS.map((option) => {
              const selected = themeMode === option.mode;
              return (
                <View key={option.mode} style={{ width: optionWidth }}>
                  <Pressable
                    onPress={() => onSelect(option.mode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={[BRAND.electric, '#9B4DFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.optionFill}
                      >
                        <Ionicons name={option.icon} size={16} color={BRAND.mist} />
                        <Text style={styles.optionTextActive} numberOfLines={1}>
                          {option.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.optionFill,
                          styles.optionIdle,
                          {
                            backgroundColor: isDark
                              ? `${BRAND.electric}14`
                              : `${BRAND.electric}08`,
                            borderColor: isDark
                              ? `${BRAND.lavender}22`
                              : `${BRAND.electric}14`,
                          },
                        ]}
                      >
                        <Ionicons name={option.icon} size={16} color={BRAND.electric} />
                        <Text
                          style={[styles.optionText, { color: palette.tileTitle }]}
                          numberOfLines={1}
                        >
                          {option.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
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
  dropdownWrap: {
    marginTop: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  option: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionFill: {
    width: '100%',
    minHeight: 50,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 14,
  },
  optionIdle: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  optionTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.mist,
    letterSpacing: 0.1,
  },
});
