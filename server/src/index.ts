import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import {
  handshake,
  getProfile,
  getGenres,
  getChannels,
  getVodList,
  getVodInfo,
  getSeriesList,
  getSeriesEpisodes,
  resolveStream,
  searchContent,
} from './portal';

const PORT = 3001;
const LOG = '[Luma Server]';

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------ */
/*  Health                                                            */
/* ------------------------------------------------------------------ */

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/* ------------------------------------------------------------------ */
/*  Stalker Portal endpoints                                          */
/* ------------------------------------------------------------------ */

app.post('/api/handshake', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac } = req.body;
    if (!portalUrl || !mac) {
      res.status(400).json({ error: 'portalUrl and mac are required' });
      return;
    }
    console.log(`${LOG} handshake → ${portalUrl} (${mac})`);
    const result = await handshake(portalUrl, mac);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} handshake error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/profile', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token } = req.body;
    if (!portalUrl || !mac || !token) {
      res.status(400).json({ error: 'portalUrl, mac, and token are required' });
      return;
    }
    console.log(`${LOG} profile → ${portalUrl}`);
    const result = await getProfile({ portalUrl, mac, token });
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} profile error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/genres', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, type } = req.body;
    if (!portalUrl || !mac || !token || !type) {
      res.status(400).json({ error: 'portalUrl, mac, token, and type are required' });
      return;
    }
    console.log(`${LOG} genres → ${portalUrl} type=${type}`);
    const result = await getGenres({ portalUrl, mac, token }, type);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} genres error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/channels', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, genreId, page = 1 } = req.body;
    if (!portalUrl || !mac || !token) {
      res.status(400).json({ error: 'portalUrl, mac, and token are required' });
      return;
    }
    console.log(`${LOG} channels → genre=${genreId} page=${page}`);
    const result = await getChannels({ portalUrl, mac, token }, genreId ?? '*', page);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} channels error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/vod-list', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, categoryId, page = 1 } = req.body;
    if (!portalUrl || !mac || !token) {
      res.status(400).json({ error: 'portalUrl, mac, and token are required' });
      return;
    }
    console.log(`${LOG} vod-list → category=${categoryId} page=${page}`);
    const result = await getVodList({ portalUrl, mac, token }, categoryId ?? '*', page);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} vod-list error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/vod-info', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, movieId } = req.body;
    if (!portalUrl || !mac || !token || !movieId) {
      res.status(400).json({ error: 'portalUrl, mac, token, and movieId are required' });
      return;
    }
    console.log(`${LOG} vod-info → movieId=${movieId}`);
    const result = await getVodInfo({ portalUrl, mac, token }, movieId);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} vod-info error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/series-list', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, categoryId, page = 1 } = req.body;
    if (!portalUrl || !mac || !token) {
      res.status(400).json({ error: 'portalUrl, mac, and token are required' });
      return;
    }
    console.log(`${LOG} series-list → category=${categoryId} page=${page}`);
    const result = await getSeriesList({ portalUrl, mac, token }, categoryId ?? '*', page);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} series-list error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/series-episodes', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, seriesId, season = 1 } = req.body;
    if (!portalUrl || !mac || !token || !seriesId) {
      res.status(400).json({ error: 'portalUrl, mac, token, and seriesId are required' });
      return;
    }
    console.log(`${LOG} series-episodes → seriesId=${seriesId} season=${season}`);
    const result = await getSeriesEpisodes({ portalUrl, mac, token }, seriesId, season);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} series-episodes error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, query, type, page = 1 } = req.body;
    if (!portalUrl || !mac || !token || !query || !type) {
      res.status(400).json({ error: 'portalUrl, mac, token, query, and type are required' });
      return;
    }
    console.log(`${LOG} search → type=${type} q="${query}" page=${page}`);
    const result = await searchContent({ portalUrl, mac, token }, type, query, page);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} search error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/stream', async (req: Request, res: Response) => {
  try {
    const { portalUrl, mac, token, cmd, type } = req.body;
    if (!portalUrl || !mac || !token || !cmd || !type) {
      res.status(400).json({ error: 'portalUrl, mac, token, cmd, and type are required' });
      return;
    }
    console.log(`${LOG} stream → type=${type}`);
    const result = await resolveStream({ portalUrl, mac, token }, cmd, type);
    res.json(result);
  } catch (err: any) {
    console.error(`${LOG} stream error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Stream proxy — pipes raw HLS/TS bytes through the server          */
/* ------------------------------------------------------------------ */

app.get('/proxy/stream', async (req: Request, res: Response) => {
  const streamUrl = req.query.url as string | undefined;
  if (!streamUrl) {
    res.status(400).json({ error: 'url query parameter is required' });
    return;
  }

  console.log(`${LOG} proxy/stream → ${streamUrl.substring(0, 80)}…`);

  try {
    const upstream = await axios.get(streamUrl, {
      responseType: 'stream',
      timeout: 15_000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C)',
      },
    });

    // Forward content-type so the player knows what it's receiving
    const contentType = upstream.headers['content-type'] as string | undefined;
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    upstream.data.pipe(res);
  } catch (err: any) {
    console.error(`${LOG} proxy/stream error:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: err.message });
    }
  }
});

/* ------------------------------------------------------------------ */
/*  Global error handler                                              */
/* ------------------------------------------------------------------ */

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`${LOG} unhandled error:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------------------------------------------------------ */
/*  Start                                                             */
/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`${LOG} running on http://localhost:${PORT}`);
});
