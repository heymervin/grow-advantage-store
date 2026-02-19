import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = req.query.client as string;

  if (!client) {
    return res.status(400).json({ error: 'Missing client parameter' });
  }

  try {
    const { data, error } = await supabase
      .from('client_ga4_connections')
      .select('property_id, property_name')
      .eq('client_slug', client)
      .order('property_name');

    if (error) throw error;

    return res.status(200).json({ properties: data || [] });
  } catch (err) {
    console.error('GA4 properties fetch error:', err);
    return res.status(500).json({
      error: 'Failed to fetch properties',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
