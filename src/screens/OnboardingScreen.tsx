import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import FocusableInput from '@/components/FocusableInput';
import FocusableButton from '@/components/FocusableButton';
import AvatarCircle, {AVATAR_COLORS} from '@/components/AvatarCircle';
import {useProfileStore, DEFAULT_ACCENT_COLOR} from '@/store';
import {apiHandshake} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const addProfile = useProfileStore(s => s.addProfile);
  const setActiveProfile = useProfileStore(s => s.setActiveProfile);

  // ---- step 1 state ----
  const [step, setStep] = useState<1 | 2>(1);
  const [portalUrl, setPortalUrl] = useState('');
  const [mac, setMac] = useState('');

  // ---- step 2 state ----
  const [profileName, setProfileName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);

  // ---- shared ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {accentColor} = useTheme();

  const handleNext = useCallback(() => {
    if (!portalUrl.trim()) {
      setError('Portal URL is required');
      return;
    }
    if (!mac.trim()) {
      setError('MAC Address is required');
      return;
    }
    setError('');
    setStep(2);
  }, [portalUrl, mac]);

  const handleSubmit = useCallback(async () => {
    if (!profileName.trim()) {
      setError('Profile name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {token} = await apiHandshake(portalUrl.trim(), mac.trim());
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

      const added = addProfile({
        id,
        name: profileName.trim(),
        avatarColor,
        accentColor: DEFAULT_ACCENT_COLOR,
        portalUrl: portalUrl.trim(),
        mac: mac.trim(),
        token,
      });

      if (!added) {
        setError('Maximum profiles reached');
        setLoading(false);
        return;
      }

      setActiveProfile(id);
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    } catch (err: any) {
      setError(err.message ?? 'Handshake failed. Check your Portal URL and MAC.');
    } finally {
      setLoading(false);
    }
  }, [portalUrl, mac, profileName, avatarColor, addProfile, setActiveProfile, navigation]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <Text style={[styles.logo, {color: accentColor}]}>LUMA</Text>
      <Text style={styles.subtitle}>
        {step === 1 ? 'Connect your IPTV portal' : 'Create your profile'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 1 ? (
        <View style={styles.form}>
          <FocusableInput
            label="Portal URL"
            value={portalUrl}
            onChangeText={setPortalUrl}
            placeholder="http://portal.example.com/c/"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            hasTVPreferredFocus
          />
          <FocusableInput
            label="MAC Address"
            value={mac}
            onChangeText={setMac}
            placeholder="00:1A:79:XX:XX:XX"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <FocusableButton label="Next" onPress={handleNext} />
        </View>
      ) : (
        <View style={styles.form}>
          <FocusableInput
            label="Profile Name"
            value={profileName}
            onChangeText={setProfileName}
            placeholder="e.g. Living Room"
            hasTVPreferredFocus
          />

          <Text style={styles.sectionLabel}>Choose an avatar color</Text>
          <View style={styles.avatarRow}>
            {AVATAR_COLORS.map(c => (
              <AvatarCircle
                key={c}
                color={c}
                label={profileName || '?'}
                size={72}
                selected={avatarColor === c}
                onPress={() => setAvatarColor(c)}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            <FocusableButton
              label="Back"
              variant="secondary"
              onPress={() => {
                setStep(1);
                setError('');
              }}
            />
            <FocusableButton
              label="Connect"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  error: {
    ...theme.typography.body,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});

export default OnboardingScreen;
