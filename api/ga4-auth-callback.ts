import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTokens(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string }>;
}

async function listGA4Properties(accessToken: string) {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Failed to list GA4 properties: ${res.status}`);
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
  const { code, state: clientSlug, error } = req.query as Record<string, string>;
  const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/ga4-auth-callback`;

  if (error) {
    return res.redirect(`/connect?client=${clientSlug}&error=${encodeURIComponent(error)}`);
  }

  if (!code || !clientSlug) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    const { access_token, refresh_token } = await getTokens(code, redirectUri);

    if (!refresh_token) {
      return res.redirect(`/connect?client=${clientSlug}&error=no_refresh_token`);
    }

    const properties = await listGA4Properties(access_token);

    if (properties.length === 0) {
      return res.redirect(`/connect?client=${clientSlug}&error=no_properties`);
    }

    const property = properties[0];

    const { error: dbError } = await supabase
      .from('client_ga4_connections')
      .upsert({
        client_slug: clientSlug,
        property_id: property.id,
        property_name: property.name,
        refresh_token,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_slug' });

    if (dbError) throw new Error(dbError.message);

    return res.redirect(`/control-dashboard?client=${clientSlug}`);
  } catch (err) {
    console.error('GA4 auth callback error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.redirect(`/connect?client=${clientSlug}&error=${encodeURIComponent(msg)}`);
  }
}
