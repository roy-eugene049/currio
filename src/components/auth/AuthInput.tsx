import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  blurOnSubmit?: boolean;
  enablesReturnKeyAutomatically?: boolean;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    showPasswordToggle = false,
    autoCapitalize = 'none',
    keyboardType = 'default',
    autoComplete = 'off',
    textContentType,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit = true,
    enablesReturnKeyAutomatically = true,
  },
  ref,
) {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const canTogglePassword = secureTextEntry && showPasswordToggle;
  const isHidden = secureTextEntry && !isPasswordVisible;

  const togglePasswordVisibility = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? colors.input : colors.input,
            borderColor: isFocused ? colors.primary : colors.inputBorder,
          },
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isHidden}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={keyboardType === 'email-address' ? false : undefined}
          spellCheck={keyboardType === 'email-address' ? false : undefined}
          editable
          style={[styles.input, { color: colors.text }]}
          {...(Platform.OS === 'web' && keyboardType === 'email-address'
            ? { inputMode: 'email' as const }
            : {})}
        />
        {canTogglePassword ? (
          <Pressable
            onPress={togglePasswordVisibility}
            hitSlop={12}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 52,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 14 : 15,
    fontSize: 16,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'solid',
          outlineWidth: 0,
        } as object)
      : {}),
  },
  toggleButton: {
    width: 48,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
