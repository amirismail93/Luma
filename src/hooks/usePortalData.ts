import {useQuery} from '@tanstack/react-query';
import {useProfileStore} from '@/store';
import {
  apiGenres,
  apiChannels,
  apiVodList,
  apiVodInfo,
  apiSeriesList,
  apiSeriesEpisodes,
  apiStream,
} from '@/services/api';

/** Return active profile credentials or null. */
function useCreds() {
  const profile = useProfileStore(s => s.getActiveProfile());
  if (!profile) return null;
  return {portalUrl: profile.portalUrl, mac: profile.mac, token: profile.token};
}

/* ------------------------------------------------------------------ */
/*  Genre / category lists                                            */
/* ------------------------------------------------------------------ */

export function useGenres(type: 'itv' | 'vod' | 'series') {
  const creds = useCreds();
  return useQuery({
    queryKey: ['genres', type, creds?.portalUrl],
    queryFn: () => apiGenres(creds!.portalUrl, creds!.mac, creds!.token, type),
    enabled: !!creds,
    staleTime: 5 * 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Live TV                                                           */
/* ------------------------------------------------------------------ */

export function useChannels(genreId: string, page = 1) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['channels', genreId, page, creds?.portalUrl],
    queryFn: () => apiChannels(creds!.portalUrl, creds!.mac, creds!.token, genreId, page),
    enabled: !!creds,
    staleTime: 2 * 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  VOD (Movies)                                                      */
/* ------------------------------------------------------------------ */

export function useVodList(categoryId: string, page = 1) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['vod-list', categoryId, page, creds?.portalUrl],
    queryFn: () => apiVodList(creds!.portalUrl, creds!.mac, creds!.token, categoryId, page),
    enabled: !!creds,
    staleTime: 5 * 60_000,
  });
}

export function useVodInfo(movieId: string | null) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['vod-info', movieId, creds?.portalUrl],
    queryFn: () => apiVodInfo(creds!.portalUrl, creds!.mac, creds!.token, movieId!),
    enabled: !!creds && !!movieId,
    staleTime: 10 * 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Series                                                            */
/* ------------------------------------------------------------------ */

export function useSeriesList(categoryId: string, page = 1) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['series-list', categoryId, page, creds?.portalUrl],
    queryFn: () => apiSeriesList(creds!.portalUrl, creds!.mac, creds!.token, categoryId, page),
    enabled: !!creds,
    staleTime: 5 * 60_000,
  });
}

export function useSeriesEpisodes(seriesId: string | null, season: number) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['series-episodes', seriesId, season, creds?.portalUrl],
    queryFn: () =>
      apiSeriesEpisodes(creds!.portalUrl, creds!.mac, creds!.token, seriesId!, season),
    enabled: !!creds && !!seriesId,
    staleTime: 10 * 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Stream resolution                                                 */
/* ------------------------------------------------------------------ */

export function useStreamUrl(cmd: string | null, type: string) {
  const creds = useCreds();
  return useQuery({
    queryKey: ['stream', cmd, type, creds?.portalUrl],
    queryFn: () => apiStream(creds!.portalUrl, creds!.mac, creds!.token, cmd!, type),
    enabled: !!creds && !!cmd,
    staleTime: 0,
  });
}
