import React, { useState, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';

interface FocusableButtonProps {
  label: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const FocusableButton: React.FC<FocusableButtonProps> = ({
  label,
  onPress,
  hasTVPreferredFocus = false,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  labelStyle,
}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const bgColor =
    variant === 'danger'
      ? theme.colors.error
      : variant === 'secondary'
      ? theme.colors.surfaceLight
      : accentColor;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[
        styles.button,
        { backgroundColor: disabled ? theme.colors.border : bgColor },
        focused && styles.focused,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.colors.textPrimary} />
      ) : (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  focused: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
    transform: [{ scale: 1.05 }],
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});

export default FocusableButton;
