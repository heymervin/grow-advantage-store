# GA4 OAuth Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Dataslayer's GA4 URLs with a direct Google Analytics Data API integration using OAuth 2.0, so any client can connect their own GA4 account via a `/connect` page.

**Architecture:** A `/connect?client=imogen` page triggers Google OAuth, the callback exchanges the code for a refresh token + lists GA4 properties, stores everything in Supabase, and a new `/api/ga4` Vercel function uses the stored refresh token to query GA4 directly. The existing ControlDashboard frontend is unchanged — it just calls `/api/ga4` instead of the Dataslayer GA4 URLs.

**Tech Stack:** React + React Router (frontend), Vercel Serverless Functions (TypeScript), Supabase (token storage), Google OAuth 2.0, Google Analytics Data API v1beta, google-auth-library (npm)

---

## Prerequisites

### Env vars already added to Vercel:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

### Env var still needed — add to Vercel:
- `SUPABASE_URL` = `https://mxqxsptrvubpjmkfkqwe.supabase.co`

### Google Cloud Console — one-time setup:
1. Enable **Google Analytics Data API** (analyticsdata.googleapis.com)
2. Enable **Google Analytics Admin API** (analyticsadmin.googleapis.com)
3. In OAuth credentials, add authorized redirect URI:
   `https://<your-vercel-domain>.vercel.app/api/ga4-auth-callback`
   Also add for local dev: `http://localhost:8888/api/ga4-auth-callback`

---

## Task 1: Install google-auth-library

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install google-auth-library
```

**Step 2: Verify install**

```bash
cat package.json | grep google-auth-library
```
Expected: `"google-auth-library": "^9.x.x"`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add google-auth-library for GA4 OAuth"
```

---

## Task 2: Create Supabase table

**Files:**
- Run SQL in Supabase dashboard

**Step 1: Run this SQL in Supabase → SQL Editor**

```sql
create table if not exists client_ga4_connections (
  id uuid primary key default gen_random_uuid(),
  client_slug text unique not null,
  property_id text not null,
  property_name text,
  refresh_token text not null,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- No RLS needed — only accessed by service role key from server
```

**Step 2: Verify table exists**

In Supabase → Table Editor, confirm `client_ga4_connections` appears.

**Step 3: Commit note**

No code to commit — this is a DB migration. Note the table in a comment.

---

## Task 3: Create `api/ga4-auth.ts` (OAuth redirect)

**Files:**
- Create: `api/ga4-auth.ts`

**Step 1: Create the file**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const client = req.query.client as string;

  if (!client) {
    return res.status(400).json({ error: 'Missing client parameter' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/ga4-auth-callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',  // force refresh token every time
    state: client,      // pass client slug through OAuth flow
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(authUrl);
}
```

**Step 2: Verify locally**

```bash
vercel dev
```

Visit: `http://localhost:3000/api/ga4-auth?client=imogen`

Expected: Browser redirects to Google login page.

**Step 3: Commit**

```bash
git add api/ga4-auth.ts
git commit -m "feat: add GA4 OAuth redirect handler"
```

---

## Task 4: Create `api/ga4-auth-callback.ts` (exchange code, store tokens)

**Files:**
- Create: `api/ga4-auth-callback.ts`

**Step 1: Create the file**

```typescript
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
      // property is like "properties/123456789"
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
    // Exchange auth code for tokens
    const { access_token, refresh_token } = await getTokens(code, redirectUri);

    if (!refresh_token) {
      return res.redirect(`/connect?client=${clientSlug}&error=no_refresh_token`);
    }

    // List GA4 properties this user has access to
    const properties = await listGA4Properties(access_token);

    if (properties.length === 0) {
      return res.redirect(`/connect?client=${clientSlug}&error=no_properties`);
    }

    // Use first property (or only property)
    const property = properties[0];

    // Store in Supabase (upsert by client_slug)
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

    return res.redirect(`/connect?client=${clientSlug}&success=true&property=${encodeURIComponent(property.name)}`);
  } catch (err) {
    console.error('GA4 auth callback error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.redirect(`/connect?client=${clientSlug}&error=${encodeURIComponent(msg)}`);
  }
}
```

**Step 2: Commit**

```bash
git add api/ga4-auth-callback.ts
git commit -m "feat: add GA4 OAuth callback — exchange code and store refresh token"
```

---

## Task 5: Create `api/ga4.ts` (query GA4 Data API)

**Files:**
- Create: `api/ga4.ts`

**Step 1: Create the file**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory cache (same pattern as dataslayer-proxy)
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

  // Check cache
  const cacheKey = `ga4_${client}_${period}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  try {
    // Load connection from Supabase
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

    // Transform to match existing Dataslayer GA4 response format:
    // result: [headers, ...rows]
    // row: [date, propertyName, activeUsers, newUsers, sessions, engagementRate, bounceRate, avgSessionDuration]
    const headers = ['date', 'propertyName', 'activeUsers', 'newUsers', 'sessions', 'engagementRate', 'bounceRate', 'avgSessionDuration'];
    const rows = (report.rows ?? []).map((row: {
      dimensionValues: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    }) => [
      row.dimensionValues[0].value,              // date
      connection.property_name,                  // propertyName
      Number(row.metricValues[0].value),         // activeUsers
      Number(row.metricValues[1].value),         // newUsers
      Number(row.metricValues[2].value),         // sessions
      Number(row.metricValues[3].value) * 100,   // engagementRate (GA4 returns 0-1, dashboard expects 0-100)
      Number(row.metricValues[4].value) * 100,   // bounceRate (same)
      Number(row.metricValues[5].value),         // avgSessionDuration (seconds)
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
```

**Step 2: Commit**

```bash
git add api/ga4.ts
git commit -m "feat: add GA4 Data API handler using stored OAuth refresh token"
```

---

## Task 6: Create `src/pages/GA4Connect.tsx`

**Files:**
- Create: `src/pages/GA4Connect.tsx`

**Step 1: Create the page**

```tsx
import { useSearchParams } from "react-router-dom";
import { Globe, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

const GA4Connect = () => {
  const [searchParams] = useSearchParams();
  const client = searchParams.get("client") || "";
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const property = searchParams.get("property");

  const handleConnect = () => {
    window.location.href = `/api/ga4-auth?client=${client}`;
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Missing Client</h1>
          <p className="text-muted-foreground">Add <code>?client=name</code> to the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connect Google Analytics
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Client: <span className="font-semibold text-foreground">{client}</span>
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Connected!</p>
                {property && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Property: {property}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Connection failed</p>
                <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {success ? "Reconnect Google Analytics" : "Connect Google Analytics"}
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            You'll be asked to sign in with Google and grant read-only access to your Analytics data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GA4Connect;
```

**Step 2: Commit**

```bash
git add src/pages/GA4Connect.tsx
git commit -m "feat: add GA4Connect page for client OAuth flow"
```

---

## Task 7: Add `/connect` route to `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read App.tsx first, then add the route**

Add import at top:
```tsx
import GA4Connect from "./pages/GA4Connect";
```

Add route inside the Router (alongside existing routes):
```tsx
<Route path="/connect" element={<GA4Connect />} />
```

**Step 2: Verify locally**

```bash
npm run dev
```

Visit: `http://localhost:5173/connect?client=imogen`

Expected: GA4Connect page renders with "Connect Google Analytics" button.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /connect route for GA4 OAuth"
```

---

## Task 8: Update `ControlDashboard.tsx` to use `/api/ga4`

**Files:**
- Modify: `src/pages/ControlDashboard.tsx`

The GA4 fetch currently uses Dataslayer URLs. Replace the `ga4Url` logic to call `/api/ga4` instead.

**Step 1: Find the ga4Url lines (~line 183-184)**

Current:
```tsx
const ga4Url = isDev
  ? clientConfigs[clientSlug].dataslayerUrls[`ga4_${timePeriod}`]
  : `/api/dataslayer-proxy?client=${clientSlug}&period=ga4_${timePeriod}`;
```

Replace with:
```tsx
const ga4Url = `/api/ga4?client=${clientSlug}&period=${timePeriod}`;
```

Note: Remove the `isDev` check — `/api/ga4` works in both dev (via `vercel dev`) and prod.

**Step 2: Verify GA4 section still renders**

After connecting Imogen's account, visit:
`https://your-vercel-domain.vercel.app/dashboard/control?client=imogen`

Expected: GA4 Website Analytics section shows real data from GA4 directly.

**Step 3: Commit**

```bash
git add src/pages/ControlDashboard.tsx
git commit -m "feat: switch GA4 data source from Dataslayer to direct GA4 API"
```

---

## Task 9: Remove GA4 URLs from `api/dataslayer-proxy.ts`

**Files:**
- Modify: `api/dataslayer-proxy.ts`

**Step 1: Remove the `ga4_*` keys from CLIENT_URLS for each client**

Delete these entries from the `imogen` config (and any future clients):
```typescript
ga4_thismonth: '...',
ga4_last7days: '...',
ga4_last30days: '...',
```

**Step 2: Commit**

```bash
git add api/dataslayer-proxy.ts
git commit -m "chore: remove GA4 Dataslayer URLs — now using direct GA4 API"
```

---

## Task 10: Deploy and test end-to-end

**Step 1: Add SUPABASE_URL env var to Vercel if not done yet**

In Vercel → Settings → Environment Variables:
```
SUPABASE_URL = https://mxqxsptrvubpjmkfkqwe.supabase.co
```

**Step 2: Deploy**

```bash
git push origin main
```

**Step 3: Connect Imogen's account**

Visit: `https://your-vercel-domain.vercel.app/connect?client=imogen`

Click "Connect Google Analytics" → log in as Imogen → approve access.

Expected: Redirected back to `/connect?client=imogen&success=true&property=...`

**Step 4: Verify GA4 data on dashboard**

Visit: `https://your-vercel-domain.vercel.app/dashboard/control?client=imogen`

Expected: GA4 Website Analytics section loads with real data. Check Network tab — calls should go to `/api/ga4?client=imogen&period=thismonth`.

**Step 5: Verify Supabase row**

In Supabase → Table Editor → `client_ga4_connections`

Expected: One row for `imogen` with `property_id`, `property_name`, and `refresh_token` populated.

---

## Done

At this point:
- Dataslayer is no longer used for GA4 data
- Any new client gets a `/connect?client=<slug>` link
- They log in once → tokens stored → dashboard shows their real GA4 data forever
