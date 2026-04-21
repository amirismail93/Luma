/**
 * Luma API — standalone mode.
 * Talks directly to Stalker / Ministra portals from the device.
 * No proxy server required.
 */
import {
  portalHandshake,
  portalProfile,
  portalGenres,
  portalChannels,
  portalVodList,
  portalVodInfo,
  portalSeriesList,
  portalSeriesEpisodes,
  portalSearch,
  portalResolveStream,
  PortalSession,
} from './portal';

/* ------------------------------------------------------------------ */
/*  Public API methods (same signatures the app already uses)         */
/* ------------------------------------------------------------------ */

export interface HandshakeResult {
  token: string;
}

export function apiHandshake(portalUrl: string, mac: string) {
  return portalHandshake(portalUrl, mac);
}

export function apiProfile(portalUrl: string, mac: string, token: string) {
  return portalProfile({ portalUrl, mac, token });
}

export function apiGenres(portalUrl: string, mac: string, token: string, type: string) {
  return portalGenres({ portalUrl, mac, token }, type);
}

export function apiChannels(
  portalUrl: string,
  mac: string,
  token: string,
  genreId: string,
  page = 1,
) {
  return portalChannels({ portalUrl, mac, token }, genreId, page);
}

export function apiVodList(
  portalUrl: string,
  mac: string,
  token: string,
  categoryId: string,
  page = 1,
) {
  return portalVodList({ portalUrl, mac, token }, categoryId, page);
}

export function apiVodInfo(portalUrl: string, mac: string, token: string, movieId: string) {
  return portalVodInfo({ portalUrl, mac, token }, movieId);
}

export function apiSeriesList(
  portalUrl: string,
  mac: string,
  token: string,
  categoryId: string,
  page = 1,
) {
  return portalSeriesList({ portalUrl, mac, token }, categoryId, page);
}

export function apiSeriesEpisodes(
  portalUrl: string,
  mac: string,
  token: string,
  seriesId: string,
  season: number,
) {
  return portalSeriesEpisodes({ portalUrl, mac, token }, seriesId, season);
}

export function apiSearch(
  portalUrl: string,
  mac: string,
  token: string,
  query: string,
  type: string,
  page = 1,
) {
  return portalSearch({ portalUrl, mac, token }, type, query, page);
}

export function apiStream(
  portalUrl: string,
  mac: string,
  token: string,
  cmd: string,
  type: string,
) {
  return portalResolveStream({ portalUrl, mac, token }, cmd, type);
}

/**
 * In standalone mode, streams are played directly — no proxy needed.
 */
export function proxyStreamUrl(streamUrl: string): string {
  return streamUrl;
}
