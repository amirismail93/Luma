import React, {useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import AvatarCircle from '@/components/AvatarCircle';
import FocusableButton from '@/components/FocusableButton';
import {useProfileStore, MAX_PROFILES} from '@/store';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ProfileSwitcherScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profiles = useProfileStore(s => s.profiles);
  const setActiveProfile = useProfileStore(s => s.setActiveProfile);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveProfile(id);
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    },
    [setActiveProfile, navigation],
  );

  const {accentColor} = useTheme();
  const canAdd = profiles.length < MAX_PROFILES;

  return (
    <View style={styles.root}>
      <Text style={[styles.logo, {color: accentColor}]}>LUMA</Text>
      <Text style={styles.title}>Who's watching?</Text>

      <ScrollView
        horizontal
        contentContainerStyle={styles.grid}
        showsHorizontalScrollIndicator={false}>
        {profiles.map((p, idx) => (
          <AvatarCircle
            key={p.id}
            color={p.avatarColor}
            label={p.name}
            size={100}
            onPress={() => handleSelect(p.id)}
            hasTVPreferredFocus={idx === 0}
          />
        ))}

        {canAdd ? (
          <AvatarCircle
            color={theme.colors.surfaceLight}
            label="+"
            size={100}
            onPress={() => navigation.navigate('Onboarding')}
          />
        ) : null}
      </ScrollView>

      <View style={styles.manageRow}>
        <FocusableButton
          label="Manage Profiles"
          variant="secondary"
          onPress={() => navigation.navigate('ManageProfiles')}
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
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  manageRow: {
    marginTop: theme.spacing.xxl,
  },
});

export default ProfileSwitcherScreen;
