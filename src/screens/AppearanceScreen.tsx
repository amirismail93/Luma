import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import FocusableButton from '@/components/FocusableButton';
import {useProfileStore} from '@/store';
import {useTheme} from '@/hooks/useTheme';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ------------------------------------------------------------------ */
/*  Preset accent colors                                              */
/* ------------------------------------------------------------------ */

const PRESETS = [
  {name: 'Ember', color: '#FF5733'},
  {name: 'Aurora', color: '#A78BFA'},
  {name: 'Jade', color: '#34D399'},
  {name: 'Gold', color: '#F0C060'},
  {name: 'Rose', color: '#FB7185'},
  {name: 'Ice', color: '#67E8F9'},
  {name: 'Silver', color: '#CBD5E1'},
] as const;

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

/* ------------------------------------------------------------------ */
/*  Toast helper                                                      */
/* ------------------------------------------------------------------ */

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

/* ------------------------------------------------------------------ */
/*  Swatch pill                                                       */
/* ------------------------------------------------------------------ */

const SwatchPill: React.FC<{
  name: string;
  color: string;
  isSelected: boolean;
  glowColor: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
}> = ({name, color, isSelected, glowColor, onPress, hasTVPreferredFocus}) => {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[
        styles.pill,
        isSelected && {borderColor: color, shadowColor: color, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8},
        focused && {borderColor: theme.colors.textPrimary, transform: [{scale: 1.08}]},
      ]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={[styles.pillLabel, isSelected && {color: theme.colors.textPrimary}]}>
        {name}
      </Text>
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

const AppearanceScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const activeProfile = useProfileStore(s => s.getActiveProfile());
  const updateProfile = useProfileStore(s => s.updateProfile);
  const {accentColor, glowColor} = useTheme();

  const [customHex, setCustomHex] = useState('');
  const [customFocused, setCustomFocused] = useState(false);
  const customInputRef = useRef<TextInput>(null);

  const applyColor = useCallback(
    (color: string) => {
      if (!activeProfile) return;
      updateProfile(activeProfile.id, {accentColor: color});
      showToast('Theme updated');
    },
    [activeProfile, updateProfile],
  );

  const handleApplyCustom = useCallback(() => {
    const hex = customHex.trim();
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!HEX_REGEX.test(normalized)) {
      showToast('Invalid hex — use format #RRGGBB');
      return;
    }
    applyColor(normalized.toUpperCase());
    setCustomHex('');
  }, [customHex, applyColor]);

  if (!activeProfile) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>No active profile</Text>
        <FocusableButton label="Go Back" onPress={() => navigation.goBack()} hasTVPreferredFocus />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollRoot} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Appearance</Text>

      {/* Section: ACCENT COLOR */}
      <Text style={styles.sectionHeader}>ACCENT COLOR</Text>

      {/* Preset swatches */}
      <View style={styles.swatchRow}>
        {PRESETS.map((p, idx) => (
          <SwatchPill
            key={p.color}
            name={p.name}
            color={p.color}
            isSelected={accentColor === p.color}
            glowColor={glowColor}
            onPress={() => applyColor(p.color)}
            hasTVPreferredFocus={idx === 0}
          />
        ))}
      </View>

      {/* Custom color row */}
      <Text style={[styles.sectionLabel, {marginTop: theme.spacing.xl}]}>Custom</Text>
      <View style={styles.customRow}>
        <Pressable
          onFocus={() => {
            setCustomFocused(true);
            customInputRef.current?.focus();
          }}
          onBlur={() => setCustomFocused(false)}
          style={[
            styles.hexInputWrapper,
            customFocused && {borderColor: accentColor},
          ]}>
          <TextInput
            ref={customInputRef}
            style={styles.hexInput}
            value={customHex}
            onChangeText={setCustomHex}
            placeholder="#FF5733"
            placeholderTextColor={theme.colors.textDisabled}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
          />
        </Pressable>
        <FocusableButton label="Apply" onPress={handleApplyCustom} />
      </View>

      {/* Current accent preview */}
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>Current accent:</Text>
        <View style={[styles.previewSwatch, {backgroundColor: accentColor}]} />
        <Text style={styles.previewHex}>{accentColor}</Text>
      </View>

      {/* Back */}
      <View style={styles.backRow}>
        <FocusableButton
          label="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScrollView>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  scrollRoot: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
    maxWidth: 600,
    width: '100%',
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
    maxWidth: 600,
    width: '100%',
  },

  /* Swatch row */
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    maxWidth: 600,
    width: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: theme.spacing.xs,
  },
  pillLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },

  /* Custom color row */
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    maxWidth: 600,
    width: '100%',
  },
  hexInputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  hexInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: 0,
  },

  /* Preview */
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  previewLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  previewSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  previewHex: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  /* Back */
  backRow: {
    marginTop: theme.spacing.xxl,
  },
});

export default AppearanceScreen;
