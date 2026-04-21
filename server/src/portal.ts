import axios, { AxiosInstance } from 'axios';

const TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (QtEmbedded; U; Linux; C)';

/**
 * Build the Cookie header expected by Stalker / Ministra portals.
 */
function buildCookie(mac: string, token?: string): string {
  let cookie = `mac=${encodeURIComponent(mac)};stb_lang=en;timezone=Europe/London`;
  if (token) {
    cookie += `;token=${token}`;
  }
  return cookie;
}

/**
 * Create a pre-configured axios instance aimed at a specific portal.
 */
export function createPortalClient(
  portalUrl: string,
  mac: string,
  token?: string,
): AxiosInstance {
  const baseURL = portalUrl.replace(/\/+$/, '');

  return axios.create({
    baseURL,
    timeout: TIMEOUT_MS,
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: buildCookie(mac, token),
      Accept: '*/*',
      'X-User-Agent':
        'Model: MAG250; Link: WiFi',
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Portal API helpers                                                */
/* ------------------------------------------------------------------ */

export interface PortalOpts {
  portalUrl: string;
  mac: string;
  token: string;
}

/**
 * Perform the initial handshake to obtain a session token.
 * Stalker URL pattern: /server/load.php?type=stb&action=handshake&...
 */
export async function handshake(
  portalUrl: string,
  mac: string,
): Promise<{ token: string }> {
  const client = createPortalClient(portalUrl, mac);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'stb',
      action: 'handshake',
      prehash: 0,
      JsHttpRequest: '1-xml',
    },
  });

  const token: string | undefined = resp.data?.js?.token;
  if (!token) {
    throw new Error('Handshake failed — no token returned by portal');
  }
  return { token };
}

/**
 * Fetch the STB profile information.
 */
export async function getProfile(opts: PortalOpts) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'stb',
      action: 'get_profile',
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch genres / categories for a given content type.
 * type = "itv" | "vod" | "series"
 */
export async function getGenres(
  opts: PortalOpts,
  contentType: string,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: contentType,
      action: 'get_genres',
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch a paginated list of live channels.
 */
export async function getChannels(
  opts: PortalOpts,
  genreId: string,
  page: number,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'itv',
      action: 'get_ordered_list',
      genre: genreId,
      p: page,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch a paginated VOD (movie) list by category.
 */
export async function getVodList(
  opts: PortalOpts,
  categoryId: string,
  page: number,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'vod',
      action: 'get_ordered_list',
      category: categoryId,
      p: page,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch detailed info for a single VOD item (movie).
 */
export async function getVodInfo(
  opts: PortalOpts,
  movieId: string,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'vod',
      action: 'get_ordered_list',
      movie_id: movieId,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch a paginated series list by category.
 */
export async function getSeriesList(
  opts: PortalOpts,
  categoryId: string,
  page: number,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'series',
      action: 'get_ordered_list',
      category: categoryId,
      p: page,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Fetch episodes for a given series + season.
 */
export async function getSeriesEpisodes(
  opts: PortalOpts,
  seriesId: string,
  season: number,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: 'series',
      action: 'get_ordered_list',
      movie_id: seriesId,
      season_id: season,
      episode_id: 0,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Search across a content type (itv, vod, series).
 */
export async function searchContent(
  opts: PortalOpts,
  contentType: string,
  query: string,
  page = 1,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: contentType,
      action: 'get_ordered_list',
      search: query,
      p: page,
      JsHttpRequest: '1-xml',
    },
  });

  return resp.data?.js ?? resp.data;
}

/**
 * Resolve a stream command to an actual playable URL.
 * The portal returns a `cmd` like "ffrt http://…/stream" — we need to
 * call create_link to get the real URL.
 */
export async function resolveStream(
  opts: PortalOpts,
  cmd: string,
  contentType: string,
) {
  const client = createPortalClient(opts.portalUrl, opts.mac, opts.token);

  const resp = await client.get('/server/load.php', {
    params: {
      type: contentType,
      action: 'create_link',
      cmd,
      JsHttpRequest: '1-xml',
    },
  });

  const data = resp.data?.js ?? resp.data;
  const url: string | undefined = data?.cmd;
  if (!url) {
    throw new Error('Stream resolution failed — no URL returned');
  }
  // Portal often prefixes with "ffrt " or "ffmpeg "
  return { url: url.replace(/^[a-z]+\s+/i, '') };
}
