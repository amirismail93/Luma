import React, {useCallback, useState} from 'react';
import {View, Text, Image, ScrollView, StyleSheet, Dimensions} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import FocusableButton from '@/components/FocusableButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import {useVodInfo} from '@/hooks/usePortalData';
import {useProfileStore, useFavoritesStore} from '@/store';
import {apiStream, proxyStreamUrl} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

const {width: SCREEN_W} = Dimensions.get('window');

type DetailRoute = RouteProp<RootStackParamList, 'MovieDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const MovieDetailScreen: React.FC = () => {
  const {params} = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());

  const {accentColor} = useTheme();
  const {data, isLoading} = useVodInfo(params.movieId);
  const movie: any = Array.isArray(data) ? data[0] : data;

  const isFav = useFavoritesStore(s =>
    profile ? s.isFavorite(profile.id, params.movieId) : false,
  );
  const addFav = useFavoritesStore(s => s.addFavorite);
  const removeFav = useFavoritesStore(s => s.removeFavorite);

  const [resolving, setResolving] = useState(false);

  const handlePlay = useCallback(async () => {
    if (!profile || !movie) return;
    setResolving(true);
    try {
      const cmd = movie.cmd ?? movie.url ?? '';
      const result = await apiStream(profile.portalUrl, profile.mac, profile.token, cmd, 'vod');
      const url = proxyStreamUrl(result.url);
      navigation.navigate('Player', {
        streamUrl: url,
        title: movie.name ?? 'Untitled',
        type: 'movie',
        contentId: params.movieId,
      });
    } catch (err: any) {
      console.warn('[Luma] Stream resolve failed', err);
    } finally {
      setResolving(false);
    }
  }, [profile, movie, params.movieId, navigation]);

  const toggleFavorite = useCallback(() => {
    if (!profile) return;
    if (isFav) {
      removeFav(profile.id, params.movieId);
    } else {
      addFav(profile.id, {
        id: params.movieId,
        title: movie?.name ?? '',
        posterUrl: movie?.screenshot_uri ?? movie?.logo,
        type: 'movie',
        addedAt: Date.now(),
      });
    }
  }, [profile, isFav, params.movieId, movie, addFav, removeFav]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <SkeletonLoader width={SCREEN_W} height={360} borderRadius={0} />
        <View style={styles.info}>
          <SkeletonLoader width={300} height={32} style={{marginBottom: 12}} />
          <SkeletonLoader width={200} height={20} style={{marginBottom: 8}} />
          <SkeletonLoader width={SCREEN_W * 0.6} height={80} />
        </View>
      </View>
    );
  }

  const poster = movie?.screenshot_uri ?? movie?.logo;
  const title = movie?.name ?? 'Untitled';
  const desc = movie?.description ?? '';
  const year = movie?.year ?? '';
  const rating = movie?.rating_imdb ?? movie?.age ?? '';

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

      {/* Main content */}
      <View style={styles.contentRow}>
        {/* Poster */}
        <View style={styles.posterWrap}>
          {poster ? (
            <Image source={{uri: poster}} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.posterLetter}>{title.charAt(0)}</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.metaRow}>
            {year ? <Text style={[styles.meta, {color: accentColor}]}>{year}</Text> : null}
            {rating ? <Text style={[styles.meta, {color: accentColor}]}>IMDb {rating}</Text> : null}
          </View>

          {desc ? (
            <Text style={styles.desc} numberOfLines={6}>
              {desc}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <FocusableButton
              label={resolving ? 'Loading...' : 'Play'}
              onPress={handlePlay}
              loading={resolving}
              disabled={resolving}
              hasTVPreferredFocus
            />
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
    height: 360,
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
  contentRow: {
    flexDirection: 'row',
    marginTop: -120,
    paddingHorizontal: theme.spacing.xxl,
  },
  posterWrap: {
    marginRight: theme.spacing.xl,
  },
  poster: {
    width: 180,
    height: 260,
    borderRadius: theme.radii.lg,
  },
  posterPlaceholder: {
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterLetter: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.textDisabled,
  },
  details: {
    flex: 1,
    paddingTop: theme.spacing.lg,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  meta: {
    ...theme.typography.label,
    fontWeight: '600',
  },
  desc: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  info: {
    padding: theme.spacing.xxl,
  },
});

export default MovieDetailScreen;
