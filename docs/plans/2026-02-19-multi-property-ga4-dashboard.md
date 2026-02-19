# Multi-Property GA4 Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add property selector dropdown and breakdown table to allow viewing aggregated data (all properties) or drilling down to individual property analytics.

**Architecture:** Add React state for selected property, create PropertySelector dropdown and PropertyBreakdownTable components, modify API to accept optional property filter, append property param to API calls when property selected.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vercel Serverless Functions, Supabase

---

## Task 1: Create `/api/ga4-properties` endpoint

**Files:**
- Create: `api/ga4-properties.ts`

**Step 1: Create the endpoint file**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

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
```

**Step 2: Test the endpoint locally**

Run:
```bash
npm run dev
```

In browser/curl:
```
http://localhost:5173/api/ga4-properties?client=imogen
```

Expected: JSON response with `properties` array containing 8 properties.

**Step 3: Commit**

```bash
git add api/ga4-properties.ts
git commit -m "feat: add endpoint to list GA4 properties for a client"
```

---

## Task 2: Modify `/api/ga4` to support property filtering

**Files:**
- Modify: `api/ga4.ts`

**Step 1: Add property param handling**

Find line ~359 where query params are extracted. After:
```typescript
const type = (req.query.type as QueryType) || 'overview';
```

Add:
```typescript
const propertyFilter = req.query.property as string | undefined;
```

**Step 2: Filter connections by property**

Find line ~379-382 where connections are fetched. After:
```typescript
const { data: connections, error: dbError } = await supabase
  .from('client_ga4_connections')
  .select('property_id, property_name, refresh_token')
  .eq('client_slug', client);
```

Add filtering logic:
```typescript
if (dbError || !connections || connections.length === 0) {
  return res.status(404).json({ error: 'No GA4 connection found for this client' });
}

// Filter to specific property if requested
const filteredConnections = propertyFilter
  ? connections.filter(conn => conn.property_id === propertyFilter)
  : connections;

if (filteredConnections.length === 0) {
  return res.status(404).json({ error: 'Property not found for this client' });
}
```

**Step 3: Use filteredConnections instead of connections**

Find line ~392 and ~395-398 where `connections` is referenced. Replace with `filteredConnections`:

```typescript
const accessToken = await getAccessToken(filteredConnections[0].refresh_token);

// Query all properties in parallel and combine results
const reports = await Promise.all(
  filteredConnections.map(conn =>
    runGA4Report(conn.property_id, accessToken, startDate, endDate, QUERY_CONFIGS[type])
  )
);
```

**Step 4: Add property breakdown data when no filter**

Find line ~427 before `return res.status(200).json(result);`

Replace with:
```typescript
const result = { result: [headers, ...allRows] };

// Add property breakdown when viewing all properties
if (!propertyFilter && type === 'overview') {
  const breakdown = filteredConnections.map((conn, i) => {
    const report = reports[i];
    const totals = (report.rows ?? []).reduce(
      (acc, row) => ({
        activeUsers: acc.activeUsers + Number(row.metricValues[0].value),
        sessions: acc.sessions + Number(row.metricValues[2].value),
        engagementRate: acc.engagementRate + Number(row.metricValues[3].value),
        bounceRate: acc.bounceRate + Number(row.metricValues[4].value),
        count: acc.count + 1,
      }),
      { activeUsers: 0, sessions: 0, engagementRate: 0, bounceRate: 0, count: 0 }
    );

    return {
      property_id: conn.property_id,
      property_name: conn.property_name ?? conn.property_id,
      activeUsers: totals.activeUsers,
      sessions: totals.sessions,
      engagementRate: totals.count > 0 ? (totals.engagementRate / totals.count) * 100 : 0,
      bounceRate: totals.count > 0 ? (totals.bounceRate / totals.count) * 100 : 0,
    };
  });

  (result as any).propertyBreakdown = breakdown;
}

cache.set(cacheKey, { data: result, timestamp: Date.now() });
```

**Step 5: Update cache key to include property filter**

Find line ~371 where cacheKey is defined:

Replace:
```typescript
const cacheKey = `ga4_${client}_${startDateParam || period}_${endDateParam || ''}_${type}`;
```

With:
```typescript
const cacheKey = `ga4_${client}_${startDateParam || period}_${endDateParam || ''}_${type}_${propertyFilter || 'all'}`;
```

**Step 6: Test the modified endpoint**

Run:
```bash
npm run dev
```

Test all properties:
```
http://localhost:5173/api/ga4?client=imogen&period=thismonth
```
Expected: Response includes `propertyBreakdown` array

Test single property:
```
http://localhost:5173/api/ga4?client=imogen&period=thismonth&property=251613729
```
Expected: Response has data for only that property, no `propertyBreakdown`

**Step 7: Commit**

```bash
git add api/ga4.ts
git commit -m "feat: add property filtering and breakdown data to GA4 API"
```

---

## Task 3: Create PropertySelector component

**Files:**
- Create: `src/components/ga4/PropertySelector.tsx`

**Step 1: Create the component file**

```typescript
import { useEffect, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

interface Property {
  property_id: string;
  property_name: string;
}

interface Props {
  clientSlug: string;
  selectedProperty: string | null;
  onPropertyChange: (propertyId: string | null) => void;
}

const PropertySelector = ({ clientSlug, selectedProperty, onPropertyChange }: Props) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!clientSlug) return;

    fetch(`/api/ga4-properties?client=${clientSlug}`)
      .then(res => res.json())
      .then(data => {
        setProperties(data.properties || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch properties:', err);
        setLoading(false);
      });
  }, [clientSlug]);

  const selectedPropertyName = selectedProperty
    ? properties.find(p => p.property_id === selectedProperty)?.property_name || 'Unknown Property'
    : 'All Properties';

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
        <Globe className="w-3 h-3 animate-pulse" />
        Loading...
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
        <Globe className="w-3 h-3" />
        No properties
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold transition-colors"
      >
        <Globe className="w-3 h-3 text-muted-foreground" />
        <span>{selectedPropertyName}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                onPropertyChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                !selectedProperty ? 'bg-muted font-semibold' : ''
              }`}
            >
              All Properties
            </button>
            <div className="border-t border-border my-1" />
            {properties.map(property => (
              <button
                key={property.property_id}
                onClick={() => {
                  onPropertyChange(property.property_id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                  selectedProperty === property.property_id ? 'bg-muted font-semibold' : ''
                }`}
              >
                {property.property_name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertySelector;
```

**Step 2: Verify component compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors related to PropertySelector

**Step 3: Commit**

```bash
git add src/components/ga4/PropertySelector.tsx
git commit -m "feat: add PropertySelector dropdown component"
```

---

## Task 4: Create PropertyBreakdownTable component

**Files:**
- Create: `src/components/ga4/PropertyBreakdownTable.tsx`

**Step 1: Create the component file**

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface PropertyBreakdownRow {
  property_id: string;
  property_name: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
}

interface Props {
  properties: PropertyBreakdownRow[];
  onPropertyClick: (propertyId: string) => void;
}

type SortKey = 'property_name' | 'activeUsers' | 'sessions' | 'engagementRate' | 'bounceRate';
type SortDirection = 'asc' | 'desc';

const PropertyBreakdownTable = ({ properties, onPropertyClick }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>('activeUsers');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedProperties = [...properties].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return ((aVal as number) - (bVal as number)) * multiplier;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercent = (num: number) => `${num.toFixed(1)}%`;

  if (properties.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Property Breakdown</h3>
        <span className="text-xs text-muted-foreground">({properties.length} properties)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th
                onClick={() => handleSort('property_name')}
                className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Property {sortKey === 'property_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('activeUsers')}
                className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Users {sortKey === 'activeUsers' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('sessions')}
                className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Sessions {sortKey === 'sessions' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('engagementRate')}
                className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Engagement {sortKey === 'engagementRate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('bounceRate')}
                className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Bounce {sortKey === 'bounceRate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProperties.map((property, index) => (
              <motion.tr
                key={property.property_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-2">
                  <button
                    onClick={() => onPropertyClick(property.property_id)}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors text-left"
                  >
                    {property.property_name}
                  </button>
                </td>
                <td className="py-3 px-2 text-right text-xs font-semibold text-foreground">
                  {formatNumber(property.activeUsers)}
                </td>
                <td className="py-3 px-2 text-right text-xs text-muted-foreground">
                  {formatNumber(property.sessions)}
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {property.engagementRate >= 50 ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-amber-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(property.engagementRate)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {property.bounceRate <= 40 ? (
                      <TrendingDown className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-amber-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(property.bounceRate)}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PropertyBreakdownTable;
```

**Step 2: Verify component compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors related to PropertyBreakdownTable

**Step 3: Commit**

```bash
git add src/components/ga4/PropertyBreakdownTable.tsx
git commit -m "feat: add PropertyBreakdownTable component"
```

---

## Task 5: Integrate components into GA4DashboardContent

**Files:**
- Modify: `src/components/ga4/GA4DashboardContent.tsx`

**Step 1: Add imports**

After line 26 (after StickinessCard import), add:
```typescript
import PropertySelector from './PropertySelector';
import PropertyBreakdownTable from './PropertyBreakdownTable';
```

**Step 2: Add state for selected property**

After line 52 (after error state), add:
```typescript
const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
const [propertyBreakdown, setPropertyBreakdown] = useState<any[]>([]);
```

**Step 3: Modify API calls to include property filter**

Find line 59 where `base` is defined. Replace:
```typescript
const base = `/api/ga4?client=${clientSlug}`;
```

With:
```typescript
const propertyParam = selectedProperty ? `&property=${selectedProperty}` : '';
const base = `/api/ga4?client=${clientSlug}${propertyParam}`;
```

**Step 4: Update useEffect dependencies**

Find line 99 where dependencies are listed. Replace:
```typescript
}, [clientSlug, period]);
```

With:
```typescript
}, [clientSlug, period, selectedProperty]);
```

**Step 5: Parse propertyBreakdown from API response**

Find line 77-92 where data is parsed. After line 91 (after stickiness parsing), add:
```typescript
        // Parse property breakdown if present
        if (overview.propertyBreakdown) {
          setPropertyBreakdown(overview.propertyBreakdown);
        } else {
          setPropertyBreakdown([]);
        }
```

**Step 6: Add PropertySelector to header**

Find line 128 where the period selector starts. Before the Calendar icon line, add:
```typescript
      {/* Property and Period selectors */}
      <div className="flex items-center gap-4">
        <PropertySelector
          clientSlug={clientSlug}
          selectedProperty={selectedProperty}
          onPropertyChange={setSelectedProperty}
        />
```

Then after line 144 (after the period selector closing div), add:
```typescript
      </div>
```

And remove the original `<div className="flex items-center gap-2">` on line 128, replacing with just the Calendar icon inside the new wrapper.

The result should look like:
```typescript
      {/* Property and Period selectors */}
      <div className="flex items-center gap-4">
        <PropertySelector
          clientSlug={clientSlug}
          selectedProperty={selectedProperty}
          onPropertyChange={setSelectedProperty}
        />

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-1">
            {/* ... existing period buttons ... */}
          </div>
        </div>
      </div>
```

**Step 7: Add PropertyBreakdownTable after HeroStats**

Find line 148-149 where HeroStats is rendered. After the closing motion.div, add:
```typescript
      {!selectedProperty && propertyBreakdown.length > 0 && (
        <PropertyBreakdownTable
          properties={propertyBreakdown}
          onPropertyClick={setSelectedProperty}
        />
      )}
```

**Step 8: Test the integration**

Run:
```bash
npm run dev
```

Navigate to `http://localhost:5173/dashboard/control?client=imogen`

Expected:
- Property selector appears next to period selector
- When "All Properties" selected, breakdown table shows after hero stats
- Clicking a property in breakdown or dropdown switches view
- All charts update based on selected property

**Step 9: Commit**

```bash
git add src/components/ga4/GA4DashboardContent.tsx
git commit -m "feat: integrate property selector and breakdown table into dashboard"
```

---

## Task 6: Deploy and test end-to-end

**Step 1: Build and verify no errors**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Push to deploy**

Run:
```bash
git push origin main
```

Expected: Vercel auto-deploys

**Step 3: Test on production**

Visit: `https://your-vercel-domain.vercel.app/dashboard/control?client=imogen`

Test:
1. ✅ Dropdown shows "All Properties" + 8 individual properties
2. ✅ Breakdown table appears with all 8 properties and metrics
3. ✅ Clicking property name in table switches to that property view
4. ✅ Breakdown table hides when viewing individual property
5. ✅ Switching back to "All Properties" shows breakdown again
6. ✅ Period selector works in both modes
7. ✅ All charts render correctly for both aggregated and filtered views

**Step 4: Verify API responses**

Check Network tab:
- `GET /api/ga4-properties?client=imogen` → Returns 8 properties
- `GET /api/ga4?client=imogen&period=thismonth` → Includes `propertyBreakdown` field
- `GET /api/ga4?client=imogen&period=thismonth&property=251613729` → No `propertyBreakdown` field

**Step 5: Final commit (if any fixes needed)**

If bugs found, fix and commit:
```bash
git add <fixed-files>
git commit -m "fix: <description>"
git push origin main
```

---

## Done

Implementation complete. The dashboard now supports:
- ✅ Viewing aggregated data from all properties (default)
- ✅ Property breakdown table showing individual property performance
- ✅ Drilling down to individual property analytics
- ✅ Seamless switching between views without URL changes
- ✅ Sortable breakdown table for quick performance comparison
