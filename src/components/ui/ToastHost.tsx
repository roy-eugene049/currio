import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/store/useToastStore';

const DISMISS_MS = 3200;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const message = useToastStore((s) => s.message);
  const type = useToastStore((s) => s.type);
  const hide = useToastStore((s) => s.hide);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(hide, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + 20 }]}
    >
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            backgroundColor: isDark ? '#1A1028EE' : '#FFFFFFEE',
            borderColor: isError
              ? isDark
                ? '#7F1D1D88'
                : '#FECACA'
              : isDark
                ? '#065F4688'
                : '#A7F3D0',
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isError ? (isDark ? '#FCA5A5' : '#991B1B') : colors.text },
          ]}
        >
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
  },
  toast: {
    maxWidth: 360,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});
