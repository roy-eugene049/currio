import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[...colors.gradientScreen]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {!isDark ? (
        <>
          <View style={[styles.glow, styles.glowOne, { backgroundColor: colors.primary }]} />
          <View style={[styles.glow, styles.glowTwo, { backgroundColor: colors.secondary }]} />
        </>
      ) : null}
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          lazy: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.06,
  },
  glowOne: {
    width: 260,
    height: 260,
    top: -90,
    right: -70,
  },
  glowTwo: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -60,
  },
});
