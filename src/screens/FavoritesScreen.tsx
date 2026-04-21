import React, {useState, useMemo} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import CategoryBar from '@/components/CategoryBar';
import ContentCard from '@/components/ContentCard';
import {useProfileStore, useFavoritesStore} from '@/store';
import {apiStream, proxyStreamUrl} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_OPTIONS = [
  {id: 'all', title: 'All'},
  {id: 'channel', title: 'Live TV'},
  {id: 'movie', title: 'Movies'},
  {id: 'series', title: 'Series'},
];

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());
  const favorites = useFavoritesStore(s =>
    profile ? s.getFavorites(profile.id) : [],
  );

  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? favorites
        : favorites.filter(f => f.type === filter),
    [favorites, filter],
  );

  const handlePress = async (item: typeof favorites[0]) => {
    if (!profile) return;

    if (item.type === 'movie') {
      navigation.navigate('MovieDetail', {movieId: item.id});
    } else if (item.type === 'series') {
      navigation.navigate('SeriesDetail', {seriesId: item.id});
    } else {
      // Live channel — resolve and play
      try {
        const result = await apiStream(
          profile.portalUrl,
          profile.mac,
          profile.token,
          item.id,
          'itv',
        );
        navigation.navigate('Player', {
          streamUrl: proxyStreamUrl(result.url),
          title: item.title,
          type: 'live',
        });
      } catch (err: any) {
        console.warn('[Luma] Fav channel play failed', err);
      }
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Favorites</Text>

      <CategoryBar
        categories={FILTER_OPTIONS}
        selectedId={filter}
        onSelect={setFilter}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {filter === 'all'
              ? 'No favorites yet'
              : `No ${FILTER_OPTIONS.find(f => f.id === filter)?.title ?? ''} favorites`}
          </Text>
          <Text style={styles.emptySubtitle}>
            Add content from detail pages or during playback
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={6}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          renderItem={({item}) => (
            <ContentCard
              id={item.id}
              title={item.title}
              posterUrl={item.posterUrl}
              variant={item.type === 'channel' ? 'landscape' : 'poster'}
              onPress={() => handlePress(item)}
              style={{marginBottom: theme.spacing.md}}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  heading: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});

export default FavoritesScreen;
