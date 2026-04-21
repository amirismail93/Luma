import { Platform } from 'react-native';

/**
 * Base URL of the Luma proxy server.
 * Android emulators use 10.0.2.2 to reach the host machine's localhost.
 * Physical devices / Fire Stick should use the LAN IP of the dev machine.
 */
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

async function post<T = any>(path: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  return json as T;
}

/* ------------------------------------------------------------------ */
/*  Public API methods                                                */
/* ------------------------------------------------------------------ */

export interface HandshakeResult {
  token: string;
}

export function apiHandshake(portalUrl: string, mac: string) {
  return post<HandshakeResult>('/api/handshake', { portalUrl, mac });
}

export function apiProfile(portalUrl: string, mac: string, token: string) {
  return post('/api/profile', { portalUrl, mac, token });
}

export function apiGenres(portalUrl: string, mac: string, token: string, type: string) {
  return post('/api/genres', { portalUrl, mac, token, type });
}

export function apiChannels(
  portalUrl: string,
  mac: string,
  token: string,
  genreId: string,
  page = 1,
) {
  return post('/api/channels', { portalUrl, mac, token, genreId, page });
}

export function apiVodList(
  portalUrl: string,
  mac: string,
  token: string,
  categoryId: string,
  page = 1,
) {
  return post('/api/vod-list', { portalUrl, mac, token, categoryId, page });
}

export function apiVodInfo(portalUrl: string, mac: string, token: string, movieId: string) {
  return post('/api/vod-info', { portalUrl, mac, token, movieId });
}

export function apiSeriesList(
  portalUrl: string,
  mac: string,
  token: string,
  categoryId: string,
  page = 1,
) {
  return post('/api/series-list', { portalUrl, mac, token, categoryId, page });
}

export function apiSeriesEpisodes(
  portalUrl: string,
  mac: string,
  token: string,
  seriesId: string,
  season: number,
) {
  return post('/api/series-episodes', { portalUrl, mac, token, seriesId, season });
}

export function apiSearch(
  portalUrl: string,
  mac: string,
  token: string,
  query: string,
  type: string,
  page = 1,
) {
  return post('/api/search', { portalUrl, mac, token, query, type, page });
}

export function apiStream(
  portalUrl: string,
  mac: string,
  token: string,
  cmd: string,
  type: string,
) {
  return post<{ url: string }>('/api/stream', { portalUrl, mac, token, cmd, type });
}

/**
 * Build a proxy-stream URL the video player can load directly.
 */
export function proxyStreamUrl(streamUrl: string): string {
  return `${BASE_URL}/proxy/stream?url=${encodeURIComponent(streamUrl)}`;
}
