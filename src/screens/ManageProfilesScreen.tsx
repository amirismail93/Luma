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
import {useProfileStore, useFavoritesStore, useWatchHistoryStore} from '@/store';
import type {Profile} from '@/store';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ManageProfilesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profiles = useProfileStore(s => s.profiles);
  const updateProfile = useProfileStore(s => s.updateProfile);
  const removeProfile = useProfileStore(s => s.removeProfile);
  const removeFavData = useFavoritesStore(s => s.removeProfileData);
  const removeHistData = useWatchHistoryStore(s => s.removeProfileData);

  const [editing, setEditing] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>('');

  const startEdit = useCallback((p: Profile) => {
    setEditing(p);
    setName(p.name);
    setAvatarColor(p.avatarColor);
  }, []);

  const handleSave = useCallback(() => {
    if (!editing) return;
    if (!name.trim()) return;
    updateProfile(editing.id, {name: name.trim(), avatarColor});
    setEditing(null);
  }, [editing, name, avatarColor, updateProfile]);

  const handleDelete = useCallback(
    (p: Profile) => {
      Alert.alert('Delete Profile', `Remove "${p.name}"? This cannot be undone.`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeProfile(p.id);
            removeFavData(p.id);
            removeHistData(p.id);
            if (editing?.id === p.id) setEditing(null);
          },
        },
      ]);
    },
    [removeProfile, removeFavData, removeHistData, editing],
  );

  if (editing) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.form}>
          <FocusableInput
            label="Profile Name"
            value={name}
            onChangeText={setName}
            hasTVPreferredFocus
          />

          <Text style={styles.sectionLabel}>Avatar Color</Text>
          <View style={styles.avatarRow}>
            {AVATAR_COLORS.map(c => (
              <AvatarCircle
                key={c}
                color={c}
                label={name || '?'}
                size={64}
                selected={avatarColor === c}
                onPress={() => setAvatarColor(c)}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            <FocusableButton
              label="Cancel"
              variant="secondary"
              onPress={() => setEditing(null)}
            />
            <FocusableButton label="Save" onPress={handleSave} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Manage Profiles</Text>

      <ScrollView
        horizontal
        contentContainerStyle={styles.grid}
        showsHorizontalScrollIndicator={false}>
        {profiles.map((p, idx) => (
          <View key={p.id} style={styles.profileCard}>
            <AvatarCircle
              color={p.avatarColor}
              label={p.name}
              size={90}
              onPress={() => startEdit(p)}
              hasTVPreferredFocus={idx === 0}
            />
            <View style={styles.cardButtons}>
              <FocusableButton
                label="Edit"
                variant="secondary"
                onPress={() => startEdit(p)}
                style={styles.smallBtn}
              />
              <FocusableButton
                label="Delete"
                variant="danger"
                onPress={() => handleDelete(p)}
                style={styles.smallBtn}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.backRow}>
        <FocusableButton
          label="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
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
    paddingVertical: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  smallBtn: {
    minWidth: 80,
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.sm,
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
  backRow: {
    marginTop: theme.spacing.xxl,
  },
});

export default ManageProfilesScreen;
