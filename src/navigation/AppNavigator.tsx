import React, {useState} from 'react';
import {StyleSheet, View, Text, Pressable} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '@/screens/HomeScreen';
import LiveTVScreen from '@/screens/LiveTVScreen';
import MoviesScreen from '@/screens/MoviesScreen';
import SeriesScreen from '@/screens/SeriesScreen';
import SearchScreen from '@/screens/SearchScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import ProfileSwitcherScreen from '@/screens/ProfileSwitcherScreen';
import ManageProfilesScreen from '@/screens/ManageProfilesScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AppearanceScreen from '@/screens/AppearanceScreen';
import MovieDetailScreen from '@/screens/MovieDetailScreen';
import SeriesDetailScreen from '@/screens/SeriesDetailScreen';
import PlayerScreen from '@/screens/PlayerScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import {useProfileStore} from '@/store';

/* ------------------------------------------------------------------ */
/*  Type definitions                                                  */
/* ------------------------------------------------------------------ */

export type RootTabParamList = {
  Home: undefined;
  LiveTV: undefined;
  Movies: undefined;
  Series: undefined;
  Favorites: undefined;
  Search: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  ProfileSwitcher: undefined;
  ManageProfiles: undefined;
  MainTabs: undefined;
  Settings: undefined;
  Appearance: undefined;
  MovieDetail: {movieId: string};
  SeriesDetail: {seriesId: string};
  Player: {
    streamUrl: string;
    title: string;
    type: 'live' | 'movie' | 'series';
    episodeInfo?: string;
    contentId?: string;
  };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/* ------------------------------------------------------------------ */
/*  Custom D-pad tab bar                                              */
/* ------------------------------------------------------------------ */

interface TabBarButtonProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({
  label,
  isFocused,
  onPress,
  hasTVPreferredFocus = false,
}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor, dimColor} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[
        styles.tabButton,
        isFocused && {backgroundColor: dimColor},
        focused && [styles.tabButtonFocused, {borderColor: accentColor}],
      ]}>
      <Text
        style={[
          styles.tabLabel,
          isFocused && {color: accentColor, fontWeight: '600' as const},
          focused && styles.tabLabelFocused,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
};

const CustomTabBar: React.FC<{
  state: any;
  descriptors: any;
  navigation: any;
}> = ({state, descriptors, navigation}) => {
  const labels: Record<string, string> = {
    Home: 'Home',
    LiveTV: 'Live TV',
    Movies: 'Movies',
    Series: 'Series',
    Favorites: 'Favorites',
    Search: 'Search',
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarButton
            key={route.key}
            label={labels[route.name] ?? route.name}
            isFocused={isFocused}
            onPress={onPress}
            hasTVPreferredFocus={index === 0}
          />
        );
      })}
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Tabs (nested inside the root stack)                          */
/* ------------------------------------------------------------------ */

const MainTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{headerShown: false}}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="LiveTV" component={LiveTVScreen} />
    <Tab.Screen name="Movies" component={MoviesScreen} />
    <Tab.Screen name="Series" component={SeriesScreen} />
    <Tab.Screen name="Favorites" component={FavoritesScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
  </Tab.Navigator>
);

/* ------------------------------------------------------------------ */
/*  Root navigator with conditional initial route                     */
/* ------------------------------------------------------------------ */

const AppNavigator: React.FC = () => {
  const profiles = useProfileStore(s => s.profiles);
  const activeProfileId = useProfileStore(s => s.activeProfileId);

  const {accentColor: navAccent} = useTheme();

  // Determine the initial screen
  let initialRoute: keyof RootStackParamList = 'Onboarding';
  if (profiles.length > 0) {
    if (profiles.length === 1) {
      // Auto-select the sole profile
      initialRoute = 'MainTabs';
    } else {
      initialRoute = 'ProfileSwitcher';
    }
  }

  // If there's exactly one profile, ensure it's active
  if (profiles.length === 1 && !activeProfileId) {
    useProfileStore.getState().setActiveProfile(profiles[0].id);
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: navAccent,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: navAccent,
        },
      }}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {backgroundColor: theme.colors.background},
        }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ProfileSwitcher" component={ProfileSwitcherScreen} />
        <Stack.Screen name="ManageProfiles" component={ManageProfilesScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Appearance" component={AppearanceScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{animation: 'fade'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginHorizontal: theme.spacing.xxs,
  },
  tabButtonFocused: {
    borderWidth: 3,
    borderRadius: theme.radii.md,
  },
  tabLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  tabLabelFocused: {
    color: theme.colors.textPrimary,
  },
});

export default AppNavigator;
