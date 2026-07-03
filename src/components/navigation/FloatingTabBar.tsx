import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';

export const DOCK_HEIGHT = 68;
export const DOCK_BOTTOM_MARGIN = 16;
export const DOCK_HORIZONTAL_PADDING = 8;
export const TAB_WIDTH = 72;
const INDICATOR_HEIGHT = DOCK_HEIGHT - 16;

const TAB_CONFIG = {
  index: { icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  profile: { icon: 'person', iconOutline: 'person-outline', label: 'You' },
} as const;

export function getTabBarInset(insetsBottom: number): number {
  return DOCK_HEIGHT + DOCK_BOTTOM_MARGIN + Math.max(insetsBottom, 8);
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10) + DOCK_BOTTOM_MARGIN;

  const visibleRoutes = state.routes.filter((route) => route.name in TAB_CONFIG);
  const activeRouteIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => state.routes.indexOf(route) === state.index),
  );

  const indicatorX = useSharedValue(activeRouteIndex * TAB_WIDTH);

  useEffect(() => {
    indicatorX.value = withSpring(activeRouteIndex * TAB_WIDTH, {
      damping: 18,
      stiffness: 220,
    });
  }, [activeRouteIndex, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.dockOuter}>
        <LinearGradient
          colors={[`${BRAND.electric}55`, `${BRAND.lavender}33`, `${BRAND.electric}44`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dockBorder}
        >
          <BlurView
            intensity={isDark ? 48 : 72}
            tint={isDark ? 'dark' : 'light'}
            style={styles.dockBlur}
          >
            <View
              style={[
                styles.dockInner,
                {
                  backgroundColor: isDark ? `${BRAND.deep}DD` : colors.chrome,
                  borderWidth: isDark ? 0 : 1,
                  borderColor: colors.chromeBorder,
                },
              ]}
            >
              <View style={styles.tabsTrack}>
                <Animated.View style={[styles.glowOrb, indicatorStyle]}>
                  <LinearGradient
                    colors={[BRAND.electric, `${BRAND.lavender}CC`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.glowOrbFill}
                  />
                </Animated.View>

                {visibleRoutes.map((route) => {
                  const index = state.routes.indexOf(route);
                  const isFocused = state.index === index;
                  const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];

                  const onPress = () => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  };

                  return (
                    <Pressable
                      key={route.key}
                      onPress={onPress}
                      style={styles.tab}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isFocused }}
                      accessibilityLabel={config.label}
                    >
                      <Ionicons
                        name={
                          (isFocused ? config.icon : config.iconOutline) as keyof typeof Ionicons.glyphMap
                        }
                        size={24}
                        color={isFocused ? BRAND.mist : colors.iconMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dockOuter: {
    transform: [{ rotate: '-2deg' }],
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  dockBorder: {
    borderRadius: 999,
    padding: 1.5,
  },
  dockBlur: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  dockInner: {
    height: DOCK_HEIGHT,
    paddingHorizontal: DOCK_HORIZONTAL_PADDING,
    justifyContent: 'center',
    borderRadius: 999,
  },
  tabsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: INDICATOR_HEIGHT,
  },
  glowOrb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TAB_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: 999,
    shadowColor: BRAND.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  glowOrbFill: {
    flex: 1,
    borderRadius: 999,
  },
  tab: {
    width: TAB_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
