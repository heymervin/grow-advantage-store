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
      name: string;
      account: string;
      displayName: string;
      propertySummaries?: Array<{ property: string; displayName: string }>;
    }>;
  };

  const accounts = [];
  for (const account of data.accountSummaries ?? []) {
    const properties = [];
    for (const prop of account.propertySummaries ?? []) {
      properties.push({
        id: prop.property.replace('properties/', ''),
        name: prop.displayName,
        fullPath: prop.property,
      });
    }
    accounts.push({
      accountId: account.account.replace('accounts/', ''),
      accountName: account.displayName,
      accountPath: account.account,
      properties,
    });
  }
  return { accounts, raw: data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = req.query.client as string;

  if (!client) {
    return res.status(400).json({ error: 'Missing client parameter. Usage: /api/ga4-check-properties?client=CLIENT_SLUG' });
  }

  try {
    // Get what's currently stored in DB
    const { data: storedConnections, error: dbError } = await supabase
      .from('client_ga4_connections')
      .select('*')
      .eq('client_slug', client);

    if (dbError) throw dbError;

    if (!storedConnections || storedConnections.length === 0) {
      return res.status(404).json({
        error: 'No GA4 connections found in database for this client',
        storedInDatabase: [],
      });
    }

    // Use the refresh token to check what Google actually has
    const accessToken = await getAccessToken(storedConnections[0].refresh_token);
    const googleData = await listGA4Properties(accessToken);

    return res.status(200).json({
      client_slug: client,
      storedInDatabase: {
        count: storedConnections.length,
        properties: storedConnections.map(conn => ({
          property_id: conn.property_id,
          property_name: conn.property_name,
          created_at: conn.created_at,
          updated_at: conn.updated_at,
        })),
      },
      availableInGoogle: {
        totalAccounts: googleData.accounts.length,
        totalProperties: googleData.accounts.reduce((sum, acc) => sum + acc.properties.length, 0),
        accounts: googleData.accounts,
      },
      mismatch: googleData.accounts.reduce((sum, acc) => sum + acc.properties.length, 0) !== storedConnections.length,
    });
  } catch (err) {
    console.error('GA4 check error:', err);
    return res.status(500).json({
      error: 'Failed to check GA4 properties',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
