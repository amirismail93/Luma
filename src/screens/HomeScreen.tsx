import React, {useMemo} from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import FocusableButton from '@/components/FocusableButton';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import {useProfileStore, useWatchHistoryStore, useFavoritesStore} from '@/store';
import {useGenres, useChannels, useVodList, useSeriesList} from '@/hooks/usePortalData';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());
  const watchHistory = useWatchHistoryStore(s =>
    profile ? s.getHistory(profile.id) : [],
  );
  const favorites = useFavoritesStore(s =>
    profile ? s.getFavorites(profile.id) : [],
  );

  const itvGenres = useGenres('itv');
  const vodGenres = useGenres('vod');
  const seriesGenres = useGenres('series');

  // Fetch first genre of each type for "featured" rows
  const firstItvGenre = (itvGenres.data as any)?.[0]?.id ?? '*';
  const firstVodGenre = (vodGenres.data as any)?.[0]?.id ?? '*';
  const firstSeriesGenre = (seriesGenres.data as any)?.[0]?.id ?? '*';

  const itvChannels = useChannels(firstItvGenre, 1);
  const vodItems = useVodList(firstVodGenre, 1);
  const seriesItems = useSeriesList(firstSeriesGenre, 1);

  // Build hero from first continue-watching or first channel
  const heroItem = useMemo(() => {
    if (watchHistory.length > 0) {
      const h = watchHistory[0];
      return {title: h.title, subtitle: 'Continue Watching', imageUrl: h.posterUrl};
    }
    const channels = (itvChannels.data as any)?.data;
    if (channels?.length > 0) {
      return {
        title: channels[0].name ?? 'Live Now',
        subtitle: 'Live TV',
        imageUrl: channels[0].logo,
      };
    }
    return {title: 'Welcome to Luma', subtitle: profile?.name ?? ''};
  }, [watchHistory, itvChannels.data, profile]);

  // Normalize portal data into card props
  const mapChannel = (c: any) => ({
    id: String(c.id ?? c.cmd),
    title: c.name ?? '',
    posterUrl: c.logo,
    channelNumber: c.number,
  });

  const mapVod = (v: any) => ({
    id: String(v.id ?? v.name),
    title: v.name ?? '',
    posterUrl: v.screenshot_uri ?? v.logo,
  });

  const continueItems = watchHistory.slice(0, 10).map(h => ({
    id: h.id,
    title: h.title,
    posterUrl: h.posterUrl,
    progress:
      h.durationSeconds > 0 ? h.progressSeconds / h.durationSeconds : undefined,
  }));

  const favItems = favorites.slice(0, 20).map(f => ({
    id: f.id,
    title: f.title,
    posterUrl: f.posterUrl,
  }));

  const channelList = ((itvChannels.data as any)?.data ?? []).map(mapChannel);
  const movieList = ((vodItems.data as any)?.data ?? []).map(mapVod);
  const seriesList = ((seriesItems.data as any)?.data ?? []).map(mapVod);

  return (
    <View style={styles.root}>
      {/* Settings button */}
      <View style={styles.settingsBtn}>
        <FocusableButton
          label="Settings"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <HeroBanner
          title={heroItem.title}
          subtitle={heroItem.subtitle}
          imageUrl={heroItem.imageUrl}
          loading={itvChannels.isLoading}
        />

        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
            variant="landscape"
          />
        )}

        {favItems.length > 0 && (
          <ContentRow
            title="My Favorites"
            items={favItems}
            variant="landscape"
          />
        )}

        <ContentRow
          title="Live TV"
          items={channelList}
          variant="landscape"
          loading={itvChannels.isLoading}
        />

        <ContentRow
          title="Movies"
          items={movieList}
          variant="poster"
          loading={vodItems.isLoading}
          onPressItem={item =>
            navigation.navigate('MovieDetail', {movieId: item.id})
          }
        />

        <ContentRow
          title="Series"
          items={seriesList}
          variant="poster"
          loading={seriesItems.isLoading}
          onPressItem={item =>
            navigation.navigate('SeriesDetail', {seriesId: item.id})
          }
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  settingsBtn: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.lg,
    zIndex: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
});

export default HomeScreen;
