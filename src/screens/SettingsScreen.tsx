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
import FocusableInput from '@/components/FocusableInput';
import FocusableButton from '@/components/FocusableButton';
import AvatarCircle, {AVATAR_COLORS} from '@/components/AvatarCircle';
import {useProfileStore, useWatchHistoryStore} from '@/store';
import type {RootStackParamList} from '@/navigation/AppNavigator';
import {apiHandshake} from '@/services/api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APP_VERSION = '0.1.0';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const activeProfile = useProfileStore(s => s.getActiveProfile());
  const updateProfile = useProfileStore(s => s.updateProfile);
  const clearHistory = useWatchHistoryStore(s => s.clearHistory);

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(activeProfile?.name ?? '');
  const [portalUrl, setPortalUrl] = useState(activeProfile?.portalUrl ?? '');
  const [mac, setMac] = useState(activeProfile?.mac ?? '');
  const [avatarColor, setAvatarColor] = useState<string>(
    activeProfile?.avatarColor ?? AVATAR_COLORS[0],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (!activeProfile) return;
    if (!name.trim() || !portalUrl.trim() || !mac.trim()) {
      setError('All fields are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Re-handshake if portal URL or MAC changed
      let token = activeProfile.token;
      if (
        portalUrl.trim() !== activeProfile.portalUrl ||
        mac.trim() !== activeProfile.mac
      ) {
        const result = await apiHandshake(portalUrl.trim(), mac.trim());
        token = result.token;
      }

      updateProfile(activeProfile.id, {
        name: name.trim(),
        portalUrl: portalUrl.trim(),
        mac: mac.trim(),
        token,
        avatarColor,
      });
      setEditMode(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to reconnect portal');
    } finally {
      setSaving(false);
    }
  }, [activeProfile, name, portalUrl, mac, avatarColor, updateProfile]);

  const handleClearHistory = useCallback(() => {
    if (!activeProfile) return;
    Alert.alert('Clear Watch History', 'This will remove all your watch history.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearHistory(activeProfile.id),
      },
    ]);
  }, [activeProfile, clearHistory]);

  const handleSwitchProfile = useCallback(() => {
    navigation.reset({index: 0, routes: [{name: 'ProfileSwitcher'}]});
  }, [navigation]);

  if (!activeProfile) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>No active profile</Text>
        <FocusableButton
          label="Go Back"
          onPress={() => navigation.goBack()}
          hasTVPreferredFocus
        />
      </View>
    );
  }

  if (editMode) {
    return (
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.editContainer}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Profile</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <FocusableInput
            label="Profile Name"
            value={name}
            onChangeText={setName}
            hasTVPreferredFocus
          />
          <FocusableInput
            label="Portal URL"
            value={portalUrl}
            onChangeText={setPortalUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <FocusableInput
            label="MAC Address"
            value={mac}
            onChangeText={setMac}
            autoCapitalize="characters"
          />

          <Text style={styles.sectionLabel}>Avatar Color</Text>
          <View style={styles.avatarRow}>
            {AVATAR_COLORS.map(c => (
              <AvatarCircle
                key={c}
                color={c}
                label={name || '?'}
                size={56}
                selected={avatarColor === c}
                onPress={() => setAvatarColor(c)}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            <FocusableButton
              label="Cancel"
              variant="secondary"
              onPress={() => {
                setEditMode(false);
                setError('');
              }}
            />
            <FocusableButton
              label="Save"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileHeader}>
        <AvatarCircle
          color={activeProfile.avatarColor}
          label={activeProfile.name}
          size={80}
        />
        <Text style={styles.profileName}>{activeProfile.name}</Text>
        <Text style={styles.profileSub}>{activeProfile.portalUrl}</Text>
      </View>

      <View style={styles.menu}>
        <FocusableButton
          label="Switch Profile"
          variant="secondary"
          onPress={handleSwitchProfile}
          hasTVPreferredFocus
        />
        <FocusableButton
          label="Edit Profile"
          variant="secondary"
          onPress={() => setEditMode(true)}
        />
        <FocusableButton
          label="Appearance"
          variant="secondary"
          onPress={() => navigation.navigate('Appearance')}
        />
        <FocusableButton
          label="Clear Watch History"
          variant="danger"
          onPress={handleClearHistory}
        />
        <FocusableButton
          label="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>

      <Text style={styles.version}>Luma v{APP_VERSION}</Text>
    </View>
  );
};

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
  editContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  error: {
    ...theme.typography.body,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  profileName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  profileSub: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  menu: {
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 320,
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
  version: {
    ...theme.typography.caption,
    color: theme.colors.textDisabled,
    marginTop: theme.spacing.xxl,
  },
});

export default SettingsScreen;
