import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

type QueryType = 'overview' | 'devices' | 'top_pages' | 'sources' | 'geography' | 'channel_quality' | 'heatmap' | 'video_events' | 'new_returning' | 'landing_pages' | 'stickiness';

function getPeriodDates(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'last7days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (period === 'last30days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  // thismonth
  return {
    startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    endDate: fmt(now),
  };
}

async function getAccessToken(refreshToken: string, clientSlug: string): Promise<string> {
  // Check if credentials are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorBody);
    } catch {
      errorDetails = errorBody;
    }

    console.error('Token refresh failed:', {
      status: res.status,
      client: clientSlug,
      error: errorDetails,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    });

    // Provide specific error messages
    if (res.status === 400) {
      const errorMsg = typeof errorDetails === 'object' ? errorDetails.error : errorDetails;
      if (errorMsg?.includes('invalid_grant')) {
        throw new Error('Refresh token is invalid or expired. Please re-authenticate via /connect page.');
      }
      throw new Error(`Token refresh failed: ${errorMsg || 'Invalid request'}. Check Google OAuth credentials.`);
    }

    throw new Error(`Token refresh failed: ${res.status} - ${JSON.stringify(errorDetails)}`);
  }

  const data = await res.json() as { access_token: string; refresh_token?: string };

  // If Google rotated the refresh token, update it
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.log(`Updating rotated refresh token for client: ${clientSlug}`);
    await supabase
      .from('client_ga4_connections')
      .update({
        refresh_token: data.refresh_token,
        updated_at: new Date().toISOString()
      })
      .eq('client_slug', clientSlug)
      .eq('refresh_token', refreshToken)
      .then(({ error }) => {
        if (error) console.error('Failed to update refresh token:', error);
      });
  }

  return data.access_token;
}

interface GA4ReportConfig {
  dimensions: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  orderBys?: Array<{ metric?: { metricName: string }; desc?: boolean }>;
  limit?: number;
}

async function runGA4Report(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  config: GA4ReportConfig
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        ...config,
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GA4 report failed: ${res.status} ${errText}`);
  }
  return res.json() as Promise<{
    rows?: Array<{
      dimensionValues: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    }>;
  }>;
}

function formatOverview(report: Awaited<ReturnType<typeof runGA4Report>>, propertyName: string) {
  const headers = ['date', 'propertyName', 'activeUsers', 'newUsers', 'sessions', 'engagementRate', 'bounceRate', 'avgSessionDuration'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    propertyName,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value),
    Number(row.metricValues[3].value) * 100,
    Number(row.metricValues[4].value) * 100,
    Number(row.metricValues[5].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatDevices(report: Awaited<ReturnType<typeof runGA4Report>>, propertyName: string) {
  // Dashboard expects: row[1]=device, row[3]=activeUsers, row[4]=sessions
  const headers = ['date', 'deviceCategory', 'propertyName', 'activeUsers', 'sessions'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    propertyName,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatTopPages(report: Awaited<ReturnType<typeof runGA4Report>>) {
  // Dashboard expects: row[2]=pageTitle, row[3]=activeUsers, row[4]=screenPageViews, row[5]=avgEngagementDuration, row[6]=bounceRate
  const headers = ['date', 'pagePath', 'pageTitle', 'activeUsers', 'screenPageViews', 'avgEngagementTime', 'bounceRate'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    row.dimensionValues[2].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value),
    Number(row.metricValues[3].value) * 100,
  ]);
  return { result: [headers, ...rows] };
}

function formatSources(report: Awaited<ReturnType<typeof runGA4Report>>) {
  // Dashboard expects: row[0]=medium, row[2]=activeUsers
  const headers = ['sessionMedium', 'date', 'activeUsers'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    Number(row.metricValues[0].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatGeography(report: Awaited<ReturnType<typeof runGA4Report>>) {
  // Dashboard expects: row[0]=country, row[3]=activeUsers
  const headers = ['country', 'date', 'sessions', 'activeUsers'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatChannelQuality(report: Awaited<ReturnType<typeof runGA4Report>>) {
  const headers = ['channel', 'activeUsers', 'sessions', 'engagementRate', 'avgSessionDuration', 'pagesPerSession'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatHeatmap(report: Awaited<ReturnType<typeof runGA4Report>>) {
  // dayOfWeek: 0=Sunday...6=Saturday, hour: 0-23
  const headers = ['dayOfWeek', 'hour', 'activeUsers', 'sessions'];
  const rows = (report.rows ?? []).map(row => [
    Number(row.dimensionValues[0].value),
    Number(row.dimensionValues[1].value),
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatVideoEvents(report: Awaited<ReturnType<typeof runGA4Report>>) {
  const headers = ['eventName', 'eventCount', 'totalUsers'];
  const rows = (report.rows ?? [])
    .filter(row => ['video_start', 'video_progress', 'video_complete'].includes(row.dimensionValues[0].value))
    .map(row => [
      row.dimensionValues[0].value,
      Number(row.metricValues[0].value),
      Number(row.metricValues[1].value),
    ]);
  return { result: [headers, ...rows] };
}

function formatNewReturning(report: Awaited<ReturnType<typeof runGA4Report>>) {
  const headers = ['segment', 'activeUsers', 'sessions', 'engagementRate', 'avgSessionDuration', 'pagesPerSession'];
  const rows = (report.rows ?? []).map(row => [
    row.dimensionValues[0].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatLandingPages(report: Awaited<ReturnType<typeof runGA4Report>>) {
  const headers = ['landingPage', 'sessions', 'activeUsers', 'engagementRate', 'pagesPerSession', 'avgSessionDuration'];
  const rows = (report.rows ?? [])
    .filter(row => {
      const page = row.dimensionValues[0].value;
      return page && page !== '(not set)';
    })
    .map(row => [
      row.dimensionValues[0].value,
      Number(row.metricValues[0].value),
      Number(row.metricValues[1].value),
      Number(row.metricValues[2].value) * 100,
      Number(row.metricValues[3].value),
      Number(row.metricValues[4].value),
    ]);
  return { result: [headers, ...rows] };
}

function formatStickiness(report: Awaited<ReturnType<typeof runGA4Report>>) {
  const headers = ['dauPerMau', 'wauPerMau', 'dauPerWau', 'active7DayUsers', 'active28DayUsers', 'activeUsers'];
  if (!report.rows || report.rows.length === 0) {
    return { result: [headers, [0, 0, 0, 0, 0, 0]] };
  }
  const row = report.rows[0];
  const values = [
    Number(row.metricValues[0].value) * 100,
    Number(row.metricValues[1].value) * 100,
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
    Number(row.metricValues[5].value),
  ];
  return { result: [headers, values] };
}

const QUERY_CONFIGS: Record<QueryType, GA4ReportConfig> = {
  overview: {
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  },
  devices: {
    dimensions: [{ name: 'date' }, { name: 'deviceCategory' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
  },
  top_pages: {
    dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 500,
  },
  sources: {
    dimensions: [{ name: 'sessionMedium' }, { name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
  },
  geography: {
    dimensions: [{ name: 'country' }, { name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
    ],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 200,
  },
  channel_quality: {
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  },
  heatmap: {
    dimensions: [{ name: 'dayOfWeek' }, { name: 'hour' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
  },
  video_events: {
    dimensions: [{ name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalUsers' },
    ],
    // We filter client-side for video events
  },
  new_returning: {
    dimensions: [{ name: 'newVsReturning' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
  },
  landing_pages: {
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'engagementRate' },
      { name: 'screenPageViewsPerSession' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 50,
  },
  stickiness: {
    dimensions: [],
    metrics: [
      { name: 'dauPerMau' },
      { name: 'wauPerMau' },
      { name: 'dauPerWau' },
      { name: 'active7DayUsers' },
      { name: 'active28DayUsers' },
      { name: 'activeUsers' },
    ],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = req.query.client as string;
  const period = req.query.period as string;
  const type = (req.query.type as QueryType) || 'overview';
  const startDateParam = req.query.startDate as string | undefined;
  const endDateParam = req.query.endDate as string | undefined;
  const propertyFilter = req.query.property as string | undefined;

  if (!client || !period) {
    return res.status(400).json({ error: 'Missing client or period parameter' });
  }

  if (!QUERY_CONFIGS[type]) {
    return res.status(400).json({ error: `Unknown type: ${type}. Valid types: overview, devices, top_pages, sources, geography, channel_quality, heatmap, video_events, new_returning, landing_pages, stickiness` });
  }

  const cacheKey = `ga4_${client}_${startDateParam || period}_${endDateParam || ''}_${type}_${propertyFilter || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  try {
    const { data: connections, error: dbError } = await supabase
      .from('client_ga4_connections')
      .select('property_id, property_name, refresh_token')
      .eq('client_slug', client);

    if (dbError || !connections || connections.length === 0) {
      return res.status(404).json({ error: 'No GA4 connection found for this client' });
    }

    // Filter to specific property if requested
    const filteredConnections = propertyFilter
      ? connections.filter(conn => conn.property_id === propertyFilter)
      : connections;

    if (filteredConnections.length === 0) {
      return res.status(404).json({ error: 'Property not found for this client' });
    }

    const { startDate, endDate } = (startDateParam && endDateParam)
      ? { startDate: startDateParam, endDate: endDateParam }
      : getPeriodDates(period);
    // All properties share the same refresh token (same OAuth session)
    const accessToken = await getAccessToken(filteredConnections[0].refresh_token, client);

    // Query all properties in parallel and combine results
    const reports = await Promise.all(
      filteredConnections.map(conn =>
        runGA4Report(conn.property_id, accessToken, startDate, endDate, QUERY_CONFIGS[type])
      )
    );

    // Combine rows from all properties, carrying property name through formatters
    const allRows: unknown[][] = [];
    let headers: unknown[] = [];

    reports.forEach((report, i) => {
      const conn = filteredConnections[i];
      const propertyName = conn.property_name ?? conn.property_id;
      const formatters: Record<QueryType, () => ReturnType<typeof formatOverview>> = {
        overview: () => formatOverview(report, propertyName),
        devices: () => formatDevices(report, propertyName),
        top_pages: () => formatTopPages(report),
        sources: () => formatSources(report),
        geography: () => formatGeography(report),
        channel_quality: () => formatChannelQuality(report),
        heatmap: () => formatHeatmap(report),
        video_events: () => formatVideoEvents(report),
        new_returning: () => formatNewReturning(report),
        landing_pages: () => formatLandingPages(report),
        stickiness: () => formatStickiness(report),
      };
      const formatted = formatters[type]();
      const [hdr, ...rows] = formatted.result;
      headers = hdr as unknown[];
      allRows.push(...(rows as unknown[][]));
    });

    const result = { result: [headers, ...allRows] };

    // Add property breakdown when viewing all properties
    if (!propertyFilter && type === 'overview') {
      const breakdown = filteredConnections.map((conn, i) => {
        const report = reports[i];
        const totals = (report.rows ?? []).reduce(
          (acc, row) => {
            const sessions = Number(row.metricValues[2].value);
            const engagementRate = Number(row.metricValues[3].value);
            const bounceRate = Number(row.metricValues[4].value);

            return {
              activeUsers: acc.activeUsers + Number(row.metricValues[0].value),
              newUsers: acc.newUsers + Number(row.metricValues[1].value),
              sessions: acc.sessions + sessions,
              engagedSessions: acc.engagedSessions + (sessions * engagementRate),
              bouncedSessions: acc.bouncedSessions + (sessions * bounceRate),
            };
          },
          { activeUsers: 0, newUsers: 0, sessions: 0, engagedSessions: 0, bouncedSessions: 0 }
        );

        const dailyData = (report.rows ?? []).map(row => ({
          date: row.dimensionValues[0].value,
          activeUsers: Number(row.metricValues[0].value),
          sessions: Number(row.metricValues[2].value),
        })).sort((a, b) => a.date.localeCompare(b.date));

        return {
          property_id: conn.property_id,
          property_name: conn.property_name ?? conn.property_id,
          activeUsers: totals.activeUsers,
          newUsers: totals.newUsers,
          sessions: totals.sessions,
          engagementRate: totals.sessions > 0 ? (totals.engagedSessions / totals.sessions) * 100 : 0,
          bounceRate: totals.sessions > 0 ? (totals.bouncedSessions / totals.sessions) * 100 : 0,
          dailyData,
        };
      });

      (result as any).propertyBreakdown = breakdown;
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (err) {
    console.error('GA4 API error:', err);
    return res.status(500).json({
      error: 'Failed to fetch GA4 data',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
