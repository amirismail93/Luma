import React, {useState, useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import ContentCard from '@/components/ContentCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import {useGenres, useChannels} from '@/hooks/usePortalData';
import {useProfileStore} from '@/store';
import {apiStream, proxyStreamUrl} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ------------------------------------------------------------------ */
/*  Sidebar category item                                             */
/* ------------------------------------------------------------------ */

const SidebarItem: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  isFirst: boolean;
}> = ({label, isActive, onPress, isFirst}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor, dimColor} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={isFirst}
      style={[
        styles.sideItem,
        isActive && {backgroundColor: dimColor},
        focused && [styles.sideItemFocused, {borderColor: accentColor}],
      ]}>
      <Text
        style={[
          styles.sideLabel,
          isActive && {color: accentColor, fontWeight: '600' as const},
          focused && styles.sideLabelFocused,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

const LiveTVScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());
  const genres = useGenres('itv');
  const genreList: any[] = Array.isArray(genres.data) ? genres.data : [];

  const allEntry = {id: '*', title: 'All'};
  const categories = [allEntry, ...genreList.map((g: any) => ({id: String(g.id), title: g.title ?? g.name ?? ''}))];

  const [selectedGenre, setSelectedGenre] = useState('*');
  const channels = useChannels(selectedGenre, 1);
  const channelData: any[] = (channels.data as any)?.data ?? [];

  const handleSelect = useCallback((id: string) => setSelectedGenre(id), []);

  return (
    <View style={styles.root}>
      {/* Left sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sideTitle}>Categories</Text>
        {genres.isLoading ? (
          Array.from({length: 8}).map((_, i) => (
            <SkeletonLoader key={i} width={160} height={36} style={{marginBottom: 6}} />
          ))
        ) : (
          <FlatList
            data={categories}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({item, index}) => (
              <SidebarItem
                label={item.title}
                isActive={item.id === selectedGenre}
                onPress={() => handleSelect(item.id)}
                isFirst={index === 0}
              />
            )}
          />
        )}
      </View>

      {/* Right channel grid */}
      <View style={styles.content}>
        <Text style={styles.heading}>Live TV</Text>

        {channels.isLoading ? (
          <View style={styles.skeletonGrid}>
            {Array.from({length: 12}).map((_, i) => (
              <SkeletonLoader key={i} width={220} height={130} style={{marginRight: 12, marginBottom: 12}} />
            ))}
          </View>
        ) : (
          <FlatList
            data={channelData}
            numColumns={4}
            keyExtractor={(item: any) => String(item.id ?? item.cmd)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
            renderItem={({item}: {item: any}) => (
              <ContentCard
                id={String(item.id ?? item.cmd)}
                title={item.name ?? ''}
                posterUrl={item.logo}
                channelNumber={item.number}
                variant="landscape"
                onPress={async () => {
                  if (!profile) return;
                  try {
                    const cmd = item.cmd ?? '';
                    const result = await apiStream(profile.portalUrl, profile.mac, profile.token, cmd, 'itv');
                    const url = proxyStreamUrl(result.url);
                    navigation.navigate('Player', {
                      streamUrl: url,
                      title: item.name ?? 'Live',
                      type: 'live',
                    });
                  } catch (err: any) {
                    console.warn('[Luma] Live stream resolve failed', err);
                  }
                }}
              />
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
  },
  sidebar: {
    width: 200,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  sideTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  sideItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: 4,
  },
  sideItemFocused: {
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceLight,
  },
  sideLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  sideLabelFocused: {
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  heading: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  grid: {
    paddingBottom: theme.spacing.xxxl,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default LiveTVScreen;
