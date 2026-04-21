/**
 * Standalone Stalker / Ministra portal client.
 * Makes requests directly from the device — no proxy server needed.
 */

const TIMEOUT_MS = 15_000;
const USER_AGENT = 'Mozilla/5.0 (QtEmbedded; U; Linux; C)';
const X_USER_AGENT = 'Model: MAG250; Link: WiFi';

function buildCookie(mac: string, token?: string): string {
  let cookie = `mac=${encodeURIComponent(mac)};stb_lang=en;timezone=Europe/London`;
  if (token) {
    cookie += `;token=${token}`;
  }
  return cookie;
}

function buildUrl(
  portalUrl: string,
  params: Record<string, string | number>,
): string {
  const base = portalUrl.replace(/\/+$/, '');
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  return `${base}/server/load.php?${qs.toString()}`;
}

async function portalGet<T = any>(
  portalUrl: string,
  mac: string,
  token: string | undefined,
  params: Record<string, string | number>,
): Promise<T> {
  const url = buildUrl(portalUrl, { ...params, JsHttpRequest: '1-xml' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'X-User-Agent': X_USER_AGENT,
        Cookie: buildCookie(mac, token),
        Accept: '*/*',
      },
      signal: controller.signal,
    });
    const json = await res.json();
    return (json?.js ?? json) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface PortalSession {
  portalUrl: string;
  mac: string;
  token: string;
}

export async function portalHandshake(
  portalUrl: string,
  mac: string,
): Promise<{ token: string }> {
  const data = await portalGet<{ token?: string }>(
    portalUrl,
    mac,
    undefined,
    { type: 'stb', action: 'handshake', prehash: 0 },
  );
  if (!data?.token) {
    throw new Error('Handshake failed — no token returned by portal');
  }
  return { token: data.token };
}

export function portalProfile(s: PortalSession) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'stb',
    action: 'get_profile',
  });
}

export function portalGenres(s: PortalSession, contentType: string) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: contentType,
    action: 'get_genres',
  });
}

export function portalChannels(
  s: PortalSession,
  genreId: string,
  page = 1,
) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'itv',
    action: 'get_ordered_list',
    genre: genreId,
    p: page,
  });
}

export function portalVodList(
  s: PortalSession,
  categoryId: string,
  page = 1,
) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'vod',
    action: 'get_ordered_list',
    category: categoryId,
    p: page,
  });
}

export function portalVodInfo(s: PortalSession, movieId: string) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'vod',
    action: 'get_ordered_list',
    movie_id: movieId,
  });
}

export function portalSeriesList(
  s: PortalSession,
  categoryId: string,
  page = 1,
) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'series',
    action: 'get_ordered_list',
    category: categoryId,
    p: page,
  });
}

export function portalSeriesEpisodes(
  s: PortalSession,
  seriesId: string,
  season: number,
) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: 'series',
    action: 'get_ordered_list',
    movie_id: seriesId,
    season_id: season,
    episode_id: 0,
  });
}

export function portalSearch(
  s: PortalSession,
  contentType: string,
  query: string,
  page = 1,
) {
  return portalGet(s.portalUrl, s.mac, s.token, {
    type: contentType,
    action: 'get_ordered_list',
    search: query,
    p: page,
  });
}

export async function portalResolveStream(
  s: PortalSession,
  cmd: string,
  contentType: string,
): Promise<{ url: string }> {
  const data = await portalGet<{ cmd?: string }>(
    s.portalUrl,
    s.mac,
    s.token,
    { type: contentType, action: 'create_link', cmd },
  );
  const url = data?.cmd;
  if (!url) {
    throw new Error('Stream resolution failed — no URL returned');
  }
  // Portal often prefixes with "ffrt " or "ffmpeg "
  return { url: url.replace(/^[a-z]+\s+/i, '') };
}
