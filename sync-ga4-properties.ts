/**
 * Sync all GA4 properties for a client without re-authenticating
 * Usage: tsx sync-ga4-properties.ts CLIENT_SLUG
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

async function main() {
  const clientSlug = process.argv[2];

  if (!clientSlug) {
    console.error('❌ Usage: tsx sync-ga4-properties.ts CLIENT_SLUG');
    process.exit(1);
  }

  console.log(`\n🔄 Syncing GA4 properties for client: ${clientSlug}\n`);

  // Get existing connection
  const { data: existingConnections, error: fetchError } = await supabase
    .from('client_ga4_connections')
    .select('refresh_token, property_id, property_name')
    .eq('client_slug', clientSlug);

  if (fetchError || !existingConnections || existingConnections.length === 0) {
    console.error('❌ No GA4 connection found for this client. They need to connect via /connect first.');
    process.exit(1);
  }

  console.log(`📦 Currently stored: ${existingConnections.length} properties`);
  existingConnections.forEach((conn, i) => {
    console.log(`   ${i + 1}. ${conn.property_name || '(no name)'} (${conn.property_id})`);
  });

  const refreshToken = existingConnections[0].refresh_token;

  // Get fresh access token
  console.log('\n🔑 Getting fresh access token...');
  const accessToken = await getAccessToken(refreshToken);

  // Fetch all properties from Google
  console.log('🌐 Fetching properties from Google...');
  const properties = await listGA4Properties(accessToken);

  console.log(`\n✅ Found ${properties.length} properties in Google:`);
  properties.forEach((prop, i) => {
    console.log(`   ${i + 1}. ${prop.name} (${prop.id})`);
  });

  if (properties.length === 0) {
    console.log('\n⚠️  No properties found in Google Analytics account');
    return;
  }

  // Upsert all properties
  console.log(`\n💾 Saving ${properties.length} properties to database...`);
  const upserts = properties.map(property => ({
    client_slug: clientSlug,
    property_id: property.id,
    property_name: property.name,
    refresh_token: refreshToken,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase
    .from('client_ga4_connections')
    .upsert(upserts, { onConflict: 'client_slug,property_id' });

  if (upsertError) {
    console.error('❌ Database upsert error:', upsertError);
    process.exit(1);
  }

  // Verify what was saved
  const { data: savedConnections } = await supabase
    .from('client_ga4_connections')
    .select('property_id, property_name')
    .eq('client_slug', clientSlug);

  console.log(`\n✅ Successfully saved ${savedConnections?.length || 0} properties:`);
  savedConnections?.forEach((conn, i) => {
    console.log(`   ${i + 1}. ${conn.property_name} (${conn.property_id})`);
  });

  console.log('\n🎉 Sync complete!\n');
}

main().catch(console.error);
