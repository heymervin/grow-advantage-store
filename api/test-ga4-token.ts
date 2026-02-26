import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Debug endpoint to test GA4 token refresh
 * Usage: /api/test-ga4-token?client=CLIENT_SLUG
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = req.query.client as string;

  if (!client) {
    return res.status(400).json({ error: 'Missing client parameter' });
  }

  try {
    // Get the stored refresh token
    const { data: connections, error: dbError } = await supabase
      .from('client_ga4_connections')
      .select('refresh_token, property_id, property_name')
      .eq('client_slug', client)
      .limit(1);

    if (dbError || !connections || connections.length === 0) {
      return res.status(404).json({ error: 'No GA4 connection found' });
    }

    const refreshToken = connections[0].refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'No refresh token stored',
        needsReauth: true,
        message: 'User needs to re-authenticate'
      });
    }

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Missing Google OAuth credentials',
        clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
      });
    }

    // Try to refresh the token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const responseBody = await tokenRes.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseBody);
    } catch {
      parsedResponse = responseBody;
    }

    if (!tokenRes.ok) {
      return res.status(200).json({
        success: false,
        httpStatus: tokenRes.status,
        error: parsedResponse,
        needsReauth: tokenRes.status === 400 || tokenRes.status === 401,
        diagnosis: tokenRes.status === 400
          ? 'Refresh token is invalid or revoked. User needs to re-authenticate.'
          : tokenRes.status === 401
          ? 'Invalid client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
          : 'Unknown error',
        storedConnection: {
          property_id: connections[0].property_id,
          property_name: connections[0].property_name,
          hasRefreshToken: !!refreshToken,
          refreshTokenPrefix: refreshToken.substring(0, 10) + '...',
        }
      });
    }

    // Success!
    return res.status(200).json({
      success: true,
      message: 'Token refresh successful!',
      hasNewRefreshToken: !!parsedResponse.refresh_token,
      tokenRotated: parsedResponse.refresh_token && parsedResponse.refresh_token !== refreshToken,
      expiresIn: parsedResponse.expires_in,
      storedConnection: {
        property_id: connections[0].property_id,
        property_name: connections[0].property_name,
      }
    });
  } catch (err) {
    console.error('Test error:', err);
    return res.status(500).json({
      error: 'Test failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
