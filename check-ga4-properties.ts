/**
 * Quick script to check GA4 properties for a client
 * Usage: tsx check-ga4-properties.ts CLIENT_SLUG
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
      });
    }
    accounts.push({
      accountName: account.displayName,
      properties,
    });
  }
  return accounts;
}

async function main() {
  const clientSlug = process.argv[2];

  if (!clientSlug) {
    console.error('❌ Usage: tsx check-ga4-properties.ts CLIENT_SLUG');
    process.exit(1);
  }

  console.log(`\n🔍 Checking GA4 properties for client: ${clientSlug}\n`);

  // Get what's stored in DB
  const { data: storedConnections, error: dbError } = await supabase
    .from('client_ga4_connections')
    .select('*')
    .eq('client_slug', clientSlug);

  if (dbError) {
    console.error('❌ Database error:', dbError);
    process.exit(1);
  }

  if (!storedConnections || storedConnections.length === 0) {
    console.log('❌ No GA4 connections found in database for this client');
    process.exit(1);
  }

  console.log('📦 STORED IN DATABASE:');
  console.log(`   Count: ${storedConnections.length} properties\n`);
  storedConnections.forEach((conn, i) => {
    console.log(`   ${i + 1}. ${conn.property_name || '(no name)'}`);
    console.log(`      ID: ${conn.property_id}`);
    console.log(`      Updated: ${conn.updated_at}\n`);
  });

  // Check what Google has
  console.log('🔍 CHECKING GOOGLE ANALYTICS...\n');
  const accessToken = await getAccessToken(storedConnections[0].refresh_token);
  const googleAccounts = await listGA4Properties(accessToken);

  console.log('🌐 AVAILABLE IN GOOGLE:');
  let totalProps = 0;
  googleAccounts.forEach((account) => {
    console.log(`\n   Account: ${account.accountName}`);
    console.log(`   Properties (${account.properties.length}):`);
    account.properties.forEach((prop, i) => {
      console.log(`      ${i + 1}. ${prop.name}`);
      console.log(`         ID: ${prop.id}`);
      totalProps++;
    });
  });

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Stored in DB: ${storedConnections.length}`);
  console.log(`   Available in Google: ${totalProps}`);
  console.log(`   Match: ${storedConnections.length === totalProps ? '✅ YES' : '❌ NO - MISMATCH!'}\n`);

  if (storedConnections.length < totalProps) {
    console.log('💡 TIP: Have the client reconnect via /connect to pull all properties\n');
  }
}

main().catch(console.error);
