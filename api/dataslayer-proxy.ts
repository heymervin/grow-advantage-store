import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory cache (persists for function lifetime ~5-15 min)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Client URL configurations
const CLIENT_URLS: Record<string, Record<string, string>> = {
  imogen: {
    // Content metrics (posts, reels, stories, carousel)
    thismonth: 'https://query-manager.dataslayer.ai/get_results/6eb3f4b6ea03aed5fa057c029f9f513e6fc8fa432442b588efd3ec4cc16344ec:42d8a00689f945deb5b115952404a040?output_type=json',
    last30days: 'https://query-manager.dataslayer.ai/get_results/36e8a4d2816eb08ecdce9aa2b5161db87f1c4e50ce92058c8bc3d1b4ca6ff45d:02b9e645810d41839081583840e8f958?output_type=json',
    last7days: 'https://query-manager.dataslayer.ai/get_results/e1bb296a16abcd6e6027dd62640dad34795ded1c54de1adebc3f78cdbb16a951:018eeb7a8434456898f4aaf4c1f0cf2f?output_type=json',
    // General account metrics (followers, profile stats)
    general_thismonth: 'https://query-manager.dataslayer.ai/get_results/4bd96536dacc4e4cc89707b217a69f9712c47145c04a0fe9aa7b72ab2b888f1c:2d09e3d1e4b54d85a593a7b8043a25d3?output_type=json',
    general_last30days: 'https://query-manager.dataslayer.ai/get_results/a7c44f7cf60b79fe8204cff4aa65b4be3fb8d6303b0f3bfbc7cf8e97d55566d1:7ba5f2e0e4af4c63b3cc0535dcc7b76f?output_type=json',
    general_last7days: 'https://query-manager.dataslayer.ai/get_results/3a9381703aeeefd7a28eb9851e405868ed8fab1992c204d890554c32dc9c3671:bf2b7bcd8ca3413295e39b52d173f387?output_type=json',
    // GA4 Website Analytics (multi-property)
    ga4_thismonth: 'https://query-manager.dataslayer.ai/get_results/b4496e25aa5d012650e33971582409bedaf4b0730d112d48fdfc31a40b28d093:ee0bc9f16c3d40d3ae362b3fe264f131?output_type=json',
    ga4_last7days: 'https://query-manager.dataslayer.ai/get_results/6bbeed93af28b0f513ea5692d7f14628136fd04ea029646a0201aca8b1440aed:3ba12564a4d647e0975d26bdd3e84508?output_type=json',
    ga4_last30days: 'https://query-manager.dataslayer.ai/get_results/ee20ad0429ab10c2683505797386ed601780c812290aa596aae955466c8689f2:a13f91cff8df4fcbbcbf56997b36473f?output_type=json',
    // Demographics (not time-specific)
    age: 'https://query-manager.dataslayer.ai/get_results/a77cee552f6b93191a67f171086b9a24c9931414466b17020adf6a6a3496efae:e2d11345df07462e966d4327a30baefc?output_type=json',
    gender: 'https://query-manager.dataslayer.ai/get_results/8646d86ed330388756d373c38ed7115563ca94047791ad364cdf8479b6f3ff7f:1de487967c8a45e4a15b3d87709bc84f?output_type=json',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min browser cache

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse query params
    const client = req.query.client as string;
    const period = req.query.period as string;

    if (!client || !period) {
      return res.status(400).json({ error: 'Missing client or period parameter' });
    }

    // Validate client and period
    if (!CLIENT_URLS[client] || !CLIENT_URLS[client][period]) {
      return res.status(404).json({ error: 'Client or period not configured' });
    }

    // Check cache
    const cacheKey = `${client}_${period}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) {
        console.log(`Cache HIT for ${cacheKey} (age: ${Math.round(age / 1000)}s)`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', String(Math.round(age / 1000)));
        return res.status(200).json(cached.data);
      } else {
        // Expired, remove from cache
        cache.delete(cacheKey);
      }
    }

    // Fetch from dataslayer
    console.log(`Cache MISS for ${cacheKey}, fetching from dataslayer...`);
    const url = CLIENT_URLS[client][period];
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Dataslayer API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    console.log(`Cached ${cacheKey} for ${CACHE_TTL / 1000}s`);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in dataslayer-proxy:', error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
