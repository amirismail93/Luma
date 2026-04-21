import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import ContentRow from '@/components/ContentRow';
import {useProfileStore} from '@/store';
import {apiSearch, apiStream, proxyStreamUrl} from '@/services/api';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEBOUNCE_MS = 400;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());

  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const {accentColor} = useTheme();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!profile || !q.trim()) {
        setChannels([]);
        setMovies([]);
        setSeries([]);
        return;
      }
      setLoading(true);
      try {
        const [ch, mov, ser] = await Promise.allSettled([
          apiSearch(profile.portalUrl, profile.mac, profile.token, q, 'itv'),
          apiSearch(profile.portalUrl, profile.mac, profile.token, q, 'vod'),
          apiSearch(profile.portalUrl, profile.mac, profile.token, q, 'series'),
        ]);
        setChannels(ch.status === 'fulfilled' ? ((ch.value as any)?.data ?? []) : []);
        setMovies(mov.status === 'fulfilled' ? ((mov.value as any)?.data ?? []) : []);
        setSeries(ser.status === 'fulfilled' ? ((ser.value as any)?.data ?? []) : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [profile],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setChannels([]);
      setMovies([]);
      setSeries([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const hasResults = channels.length > 0 || movies.length > 0 || series.length > 0;
  const hasQuery = query.trim().length > 0;

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

  const handleChannelPress = useCallback(
    async (item: any) => {
      if (!profile) return;
      try {
        const raw = channels.find((c: any) => String(c.id ?? c.cmd) === item.id);
        const cmd = raw?.cmd ?? '';
        const result = await apiStream(profile.portalUrl, profile.mac, profile.token, cmd, 'itv');
        navigation.navigate('Player', {
          streamUrl: proxyStreamUrl(result.url),
          title: item.title,
          type: 'live',
        });
      } catch (err: any) {
        console.warn('[Luma] Search → Live stream failed', err);
      }
    },
    [profile, channels, navigation],
  );

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, inputFocused && [styles.inputFocused, {borderColor: accentColor}]]}
          placeholder="Search channels, movies, series..."
          placeholderTextColor={theme.colors.textDisabled}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {loading && <ActivityIndicator color={accentColor} style={styles.spinner} />}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!hasQuery && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Discover Luma</Text>
            <Text style={styles.emptySubtitle}>
              Search across Live TV, Movies, and Series
            </Text>
          </View>
        )}

        {hasQuery && !loading && !hasResults && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing found in Luma</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term
            </Text>
          </View>
        )}

        {channels.length > 0 && (
          <ContentRow
            title="Live Channels"
            items={channels.map(mapChannel)}
            variant="landscape"
            onPressItem={handleChannelPress}
          />
        )}

        {movies.length > 0 && (
          <ContentRow
            title="Movies"
            items={movies.map(mapVod)}
            variant="poster"
            onPressItem={item =>
              navigation.navigate('MovieDetail', {movieId: item.id})
            }
          />
        )}

        {series.length > 0 && (
          <ContentRow
            title="Series"
            items={series.map(mapVod)}
            variant="poster"
            onPressItem={item =>
              navigation.navigate('SeriesDetail', {seriesId: item.id})
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 18,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  inputFocused: {
  },
  spinner: {
    marginLeft: theme.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});

export default SearchScreen;
