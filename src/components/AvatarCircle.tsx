import React, { useState, useCallback } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';

export const AVATAR_COLORS = [
  '#00C2FF', // cool blue (accent)
  '#FF5252', // red
  '#00E676', // green
  '#FFD600', // yellow
  '#BB86FC', // purple
  '#FF6D00', // orange
] as const;

interface AvatarCircleProps {
  color: string;
  label?: string;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
}

const AvatarCircle: React.FC<AvatarCircleProps> = ({
  color,
  label,
  size = 80,
  selected = false,
  onPress,
  hasTVPreferredFocus = false,
}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const initials = label
    ? label
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <Pressable
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={styles.pressable}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          selected && {borderColor: accentColor},
          focused && styles.focused,
        ]}>
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.35 },
          ]}>
          {initials}
        </Text>
      </View>
      {label ? (
        <Text style={styles.name} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: theme.colors.textPrimary,
    transform: [{ scale: 1.12 }],
  },
  initials: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  name: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
    maxWidth: 100,
    textAlign: 'center',
  },
});

export default AvatarCircle;
