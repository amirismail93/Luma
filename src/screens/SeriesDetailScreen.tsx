import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import FocusableButton from '@/components/FocusableButton';
import ContentCard from '@/components/ContentCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import {useVodInfo, useSeriesEpisodes} from '@/hooks/usePortalData';
import {useProfileStore, useFavoritesStore} from '@/store';
import {apiStream, proxyStreamUrl} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

const {width: SCREEN_W} = Dimensions.get('window');

type DetailRoute = RouteProp<RootStackParamList, 'SeriesDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ------------------------------------------------------------------ */
/*  Season tab                                                        */
/* ------------------------------------------------------------------ */

const SeasonTab: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  isFirst: boolean;
}> = ({label, isActive, onPress, isFirst}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={isFirst}
      style={[
        styles.seasonTab,
        isActive && {backgroundColor: accentColor},
        focused && styles.seasonTabFocused,
      ]}>
      <Text
        style={[
          styles.seasonLabel,
          isActive && styles.seasonLabelActive,
          focused && styles.seasonLabelFocused,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

const SeriesDetailScreen: React.FC = () => {
  const {params} = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());

  // Series info (reuse vod-info endpoint — portal treats both similarly)
  const {accentColor: seriesAccent} = useTheme();
  const {data, isLoading} = useVodInfo(params.seriesId);
  const series: any = Array.isArray(data) ? data[0] : data;

  // Seasons — derive from series data or default to [1]
  const totalSeasons: number = series?.series?.length ?? series?.season_count ?? 1;
  const seasonNumbers = Array.from({length: totalSeasons}, (_, i) => i + 1);
  const [activeSeason, setActiveSeason] = useState(1);

  // Episodes for the active season
  const episodes = useSeriesEpisodes(params.seriesId, activeSeason);
  const episodeData: any[] = Array.isArray(episodes.data)
    ? episodes.data
    : (episodes.data as any)?.data ?? [];

  const isFav = useFavoritesStore(s =>
    profile ? s.isFavorite(profile.id, params.seriesId) : false,
  );
  const addFav = useFavoritesStore(s => s.addFavorite);
  const removeFav = useFavoritesStore(s => s.removeFavorite);

  const toggleFavorite = useCallback(() => {
    if (!profile) return;
    if (isFav) {
      removeFav(profile.id, params.seriesId);
    } else {
      addFav(profile.id, {
        id: params.seriesId,
        title: series?.name ?? '',
        posterUrl: series?.screenshot_uri ?? series?.logo,
        type: 'series',
        addedAt: Date.now(),
      });
    }
  }, [profile, isFav, params.seriesId, series, addFav, removeFav]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <SkeletonLoader width={SCREEN_W} height={320} borderRadius={0} />
        <View style={styles.info}>
          <SkeletonLoader width={300} height={32} style={{marginBottom: 12}} />
          <SkeletonLoader width={200} height={20} />
        </View>
      </View>
    );
  }

  const poster = series?.screenshot_uri ?? series?.logo;
  const title = series?.name ?? 'Untitled';
  const desc = series?.description ?? '';
  const year = series?.year ?? '';
  const rating = series?.rating_imdb ?? series?.age ?? '';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>
      {/* Backdrop */}
      <View style={styles.backdrop}>
        {poster ? (
          <Image source={{uri: poster}} style={styles.backdropImage} resizeMode="cover" blurRadius={8} />
        ) : (
          <View style={styles.backdropFallback} />
        )}
        <View style={styles.backdropOverlay} />
      </View>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.posterWrap}>
          {poster ? (
            <Image source={{uri: poster}} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.posterLetter}>{title.charAt(0)}</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            {year ? <Text style={[styles.meta, {color: seriesAccent}]}>{year}</Text> : null}
            {rating ? <Text style={[styles.meta, {color: seriesAccent}]}>IMDb {rating}</Text> : null}
            <Text style={[styles.meta, {color: seriesAccent}]}>{totalSeasons} Season{totalSeasons !== 1 ? 's' : ''}</Text>
          </View>
          {desc ? <Text style={styles.desc} numberOfLines={4}>{desc}</Text> : null}

          <View style={styles.actions}>
            <FocusableButton
              label={isFav ? 'Remove Favorite' : 'Add to Favorites'}
              variant="secondary"
              onPress={toggleFavorite}
            />
            <FocusableButton
              label="Back"
              variant="secondary"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </View>

      {/* Season tabs */}
      <View style={styles.seasonRow}>
        {seasonNumbers.map(n => (
          <SeasonTab
            key={n}
            label={`Season ${n}`}
            isActive={activeSeason === n}
            onPress={() => setActiveSeason(n)}
            isFirst={n === 1}
          />
        ))}
      </View>

      {/* Episodes */}
      {episodes.isLoading ? (
        <View style={styles.episodeSkeletonRow}>
          {Array.from({length: 6}).map((_, i) => (
            <SkeletonLoader key={i} width={220} height={130} style={{marginRight: 12}} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={episodeData}
          keyExtractor={(item: any, idx) => String(item.id ?? idx)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.episodeList}
          renderItem={({item, index}: {item: any; index: number}) => (
            <ContentCard
              id={String(item.id ?? index)}
              title={`E${item.series_number ?? index + 1}: ${item.name ?? ''}`}
              posterUrl={item.screenshot_uri ?? item.logo}
              variant="landscape"
              onPress={async () => {
                if (!profile) return;
                try {
                  const cmd = item.cmd ?? item.url ?? '';
                  const result = await apiStream(profile.portalUrl, profile.mac, profile.token, cmd, 'vod');
                  const url = proxyStreamUrl(result.url);
                  navigation.navigate('Player', {
                    streamUrl: url,
                    title: series?.name ?? 'Series',
                    type: 'series',
                    episodeInfo: `S${activeSeason}E${item.series_number ?? index + 1}: ${item.name ?? ''}`,
                    contentId: String(item.id ?? index),
                  });
                } catch (err: any) {
                  console.warn('[Luma] Episode stream resolve failed', err);
                }
              }}
            />
          )}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  backdrop: {
    width: SCREEN_W,
    height: 320,
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backdropFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surface,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  headerRow: {
    flexDirection: 'row',
    marginTop: -100,
    paddingHorizontal: theme.spacing.xxl,
  },
  posterWrap: {
    marginRight: theme.spacing.xl,
  },
  poster: {
    width: 160,
    height: 230,
    borderRadius: theme.radii.lg,
  },
  posterPlaceholder: {
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterLetter: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.textDisabled,
  },
  details: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    ...theme.typography.label,
    fontWeight: '600',
  },
  desc: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  seasonRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  seasonTab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surfaceLight,
  },
  seasonTabFocused: {
    borderWidth: 2,
    borderColor: theme.colors.textPrimary,
    transform: [{scale: 1.06}],
  },
  seasonLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  seasonLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  seasonLabelFocused: {
    color: theme.colors.textPrimary,
  },
  episodeList: {
    paddingHorizontal: theme.spacing.xxl,
  },
  episodeSkeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xxl,
  },
  info: {
    padding: theme.spacing.xxl,
  },
});

export default SeriesDetailScreen;
