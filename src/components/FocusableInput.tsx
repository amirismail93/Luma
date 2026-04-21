import React, { useState, useCallback, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';

interface FocusableInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hasTVPreferredFocus?: boolean;
  error?: string;
}

const FocusableInput: React.FC<FocusableInputProps> = ({
  label,
  value,
  onChangeText,
  hasTVPreferredFocus = false,
  error,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    setFocused(true);
    // When the Pressable wrapper receives TV focus, forward it to the TextInput
    inputRef.current?.focus();
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.inputWrapper,
          focused && [styles.inputFocused, {borderColor: accentColor}],
          error ? styles.inputError : null,
        ]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={theme.colors.textDisabled}
          selectionColor={accentColor}
          {...rest}
        />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxs,
  },
  inputWrapper: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputFocused: {
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xxs,
  },
});

export default FocusableInput;
