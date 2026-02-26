import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Refreshes the access token and updates the refresh token if Google rotates it
 */
export async function refreshAccessToken(
  clientSlug: string,
  currentRefreshToken: string
): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: currentRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Token refresh failed:', res.status, errorBody);

    // If token is invalid, clear it from database
    if (res.status === 400 || res.status === 401) {
      console.log(`Clearing invalid refresh token for client: ${clientSlug}`);
      await supabase
        .from('client_ga4_connections')
        .update({ refresh_token: null })
        .eq('client_slug', clientSlug);
    }

    throw new Error(`Token refresh failed: ${res.status} - ${errorBody}`);
  }

  const data = await res.json() as TokenResponse;

  // If Google rotated the refresh token, update it in the database
  if (data.refresh_token && data.refresh_token !== currentRefreshToken) {
    console.log(`Updating rotated refresh token for client: ${clientSlug}`);
    const { error: updateError } = await supabase
      .from('client_ga4_connections')
      .update({
        refresh_token: data.refresh_token,
        updated_at: new Date().toISOString()
      })
      .eq('client_slug', clientSlug)
      .eq('refresh_token', currentRefreshToken);

    if (updateError) {
      console.error('Failed to update refresh token:', updateError);
      // Don't throw - we still have a valid access token
    }
  }

  return data.access_token;
}

/**
 * Gets a fresh access token for a client, handling token rotation
 */
export async function getClientAccessToken(clientSlug: string): Promise<string> {
  const { data: connections, error } = await supabase
    .from('client_ga4_connections')
    .select('refresh_token')
    .eq('client_slug', clientSlug)
    .limit(1);

  if (error || !connections || connections.length === 0) {
    throw new Error('No GA4 connection found for this client');
  }

  const refreshToken = connections[0].refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token found - client needs to re-authenticate');
  }

  return refreshAccessToken(clientSlug, refreshToken);
}
