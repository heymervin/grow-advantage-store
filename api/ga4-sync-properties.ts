import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function listGA4Properties(accessToken: string) {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list GA4 properties: ${res.status} - ${errorText}`);
  }
  const data = await res.json() as {
    accountSummaries?: Array<{
      propertySummaries?: Array<{ property: string; displayName: string }>;
    }>;
  };

  const properties: Array<{ id: string; name: string }> = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      properties.push({
        id: prop.property.replace('properties/', ''),
        name: prop.displayName,
      });
    }
  }
  return properties;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = req.query.client as string;

  if (!client) {
    return res.status(400).json({ error: 'Missing client parameter. Usage: /api/ga4-sync-properties?client=CLIENT_SLUG' });
  }

  try {
    // Get existing connection to get the refresh token
    const { data: existingConnections, error: fetchError } = await supabase
      .from('client_ga4_connections')
      .select('refresh_token')
      .eq('client_slug', client)
      .limit(1);

    if (fetchError || !existingConnections || existingConnections.length === 0) {
      return res.status(404).json({
        error: 'No GA4 connection found for this client. They need to connect via /connect first.',
      });
    }

    const refreshToken = existingConnections[0].refresh_token;

    // Get fresh access token
    const accessToken = await getAccessToken(refreshToken);

    // Fetch all properties from Google
    const properties = await listGA4Properties(accessToken);

    console.log(`[GA4 Sync] Found ${properties.length} properties for ${client}:`, properties);

    if (properties.length === 0) {
      return res.status(200).json({
        message: 'No properties found in Google Analytics account',
        synced: 0,
        properties: [],
      });
    }

    // Upsert all properties
    const upserts = properties.map(property => ({
      client_slug: client,
      property_id: property.id,
      property_name: property.name,
      refresh_token: refreshToken,
      updated_at: new Date().toISOString(),
    }));

    console.log(`[GA4 Sync] Upserting ${upserts.length} properties...`);

    const { error: upsertError } = await supabase
      .from('client_ga4_connections')
      .upsert(upserts, { onConflict: 'client_slug,property_id' });

    if (upsertError) {
      console.error('[GA4 Sync] Upsert error:', upsertError);
      throw new Error(`Database upsert failed: ${upsertError.message}`);
    }

    // Verify what was saved
    const { data: savedConnections } = await supabase
      .from('client_ga4_connections')
      .select('property_id, property_name')
      .eq('client_slug', client);

    console.log(`[GA4 Sync] Successfully saved ${savedConnections?.length || 0} properties`);

    return res.status(200).json({
      message: 'Properties synced successfully',
      foundInGoogle: properties.length,
      savedToDatabase: savedConnections?.length || 0,
      properties: savedConnections || [],
    });
  } catch (err) {
    console.error('[GA4 Sync] Error:', err);
    return res.status(500).json({
      error: 'Failed to sync GA4 properties',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
