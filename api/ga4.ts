import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

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

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function runGA4Report(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string
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
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`GA4 report failed: ${res.status}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = req.query.client as string;
  const period = req.query.period as string;

  if (!client || !period) {
    return res.status(400).json({ error: 'Missing client or period parameter' });
  }

  const cacheKey = `ga4_${client}_${period}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  try {
    const { data: connection, error: dbError } = await supabase
      .from('client_ga4_connections')
      .select('property_id, property_name, refresh_token')
      .eq('client_slug', client)
      .single();

    if (dbError || !connection) {
      return res.status(404).json({ error: 'No GA4 connection found for this client' });
    }

    const { startDate, endDate } = getPeriodDates(period);
    const accessToken = await getAccessToken(connection.refresh_token);
    const report = await runGA4Report(connection.property_id, accessToken, startDate, endDate);

    // Return same format as old Dataslayer GA4 response
    const headers = ['date', 'propertyName', 'activeUsers', 'newUsers', 'sessions', 'engagementRate', 'bounceRate', 'avgSessionDuration'];
    const rows = (report.rows ?? []).map((row: {
      dimensionValues: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    }) => [
      row.dimensionValues[0].value,
      connection.property_name,
      Number(row.metricValues[0].value),
      Number(row.metricValues[1].value),
      Number(row.metricValues[2].value),
      Number(row.metricValues[3].value) * 100,  // GA4 returns 0-1, dashboard expects 0-100
      Number(row.metricValues[4].value) * 100,
      Number(row.metricValues[5].value),
    ]);

    const result = { result: [headers, ...rows] };
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
