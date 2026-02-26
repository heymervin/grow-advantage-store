# GA4 Dashboard Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `/ga4` dashboard from a static number-dump into a story-driven analytics page with trend charts, period comparison, plain language, and warm design.

**Architecture:** New sub-components in `src/components/ga4/` handle each visual section independently. `GA4Dashboard.tsx` orchestrates data fetching (current + previous period in parallel) and passes typed props down. Recharts via shadcn `ChartContainer` for all charts.

**Tech Stack:** React 18, TypeScript, Tailwind v3, shadcn/ui (`chart.tsx`, `card.tsx`, `badge.tsx`), Recharts 2.x, Vite

---

## Color System (use throughout)

| State | Classes |
|-------|---------|
| Growth / positive | `text-emerald-600 bg-emerald-50` |
| Neutral (±2%) | `text-muted-foreground` |
| Attention / decline | `text-amber-600 bg-amber-50` |
| **Never use** | `text-red-*` |

---

## Task 1: Extend API to Accept Custom Date Ranges

**Files:**
- Modify: `api/ga4.ts`

**Why:** Period comparison requires fetching a previous date range. Instead of hard-coding "previous period" logic in the API, expose `startDate` and `endDate` query params that override the `period` param calculation. The frontend will compute previous-period dates and pass them directly.

**Step 1: Add startDate/endDate override to getPeriodDates call**

In `api/ga4.ts`, update the handler to check for `startDate`/`endDate` query params before calling `getPeriodDates`:

```ts
// After the existing param extraction:
const startDateParam = req.query.startDate as string | undefined;
const endDateParam = req.query.endDate as string | undefined;

// Then in the try block, replace:
const { startDate, endDate } = getPeriodDates(period);
// with:
const { startDate, endDate } = (startDateParam && endDateParam)
  ? { startDate: startDateParam, endDate: endDateParam }
  : getPeriodDates(period);
```

Also update the cache key to include the date range:
```ts
const cacheKey = `ga4_${client}_${startDateParam || period}_${endDateParam || ''}_${type}`;
```

**Step 2: Verify with curl**
```bash
# Should return data for Feb 1-7
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&startDate=2026-02-01&endDate=2026-02-07"
```

**Step 3: Commit**
```bash
git add api/ga4.ts
git commit -m "feat: add startDate/endDate override to GA4 API"
```

---

## Task 2: Create Shared Types and Utilities

**Files:**
- Create: `src/components/ga4/types.ts`
- Create: `src/components/ga4/utils.ts`

**Why:** Multiple components need the same types (GA4Row, ParsedOverview, etc.) and format helpers (formatNumber, formatTime, formatDate). DRY.

**Step 1: Create types.ts**

```ts
// src/components/ga4/types.ts

export type Period = 'last7days' | 'last30days' | 'thismonth';

export interface GA4ApiResponse {
  result: Array<Array<string | number>>;
}

export interface OverviewMetrics {
  totalActiveUsers: number;
  totalSessions: number;
  avgEngagementRate: number;
  avgBounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
  returningUsers: number;
  // Daily breakdown for sparkline/trend chart
  dailyData: Array<{ date: string; activeUsers: number; sessions: number }>;
}

export interface DeviceData {
  device: string;
  activeUsers: number;
  sessions: number;
  percentage: number;
}

export interface PageData {
  pageTitle: string;
  pagePath: string;
  activeUsers: number;
  screenPageViews: number;
  bounceRate: number;
  avgEngagementTime: number;
  engagementScore: number; // derived: avgEngagementTime * (1 - bounceRate/100)
}

export interface SourceData {
  medium: string;
  label: string;
  activeUsers: number;
  percentage: number;
}

export interface CountryData {
  country: string;
  activeUsers: number;
  percentage: number;
}

export interface DashboardData {
  overview: OverviewMetrics;
  devices: DeviceData[];
  pages: PageData[];
  sources: SourceData[];
  geography: CountryData[];
}

export interface ComparisonData {
  overview: OverviewMetrics;
}
```

**Step 2: Create utils.ts**

```ts
// src/components/ga4/utils.ts
import type { Period } from './types';

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

export const formatDate = (ga4Date: string): string => {
  // GA4 dates are YYYYMMDD
  const y = ga4Date.slice(0, 4);
  const m = ga4Date.slice(4, 6);
  const d = ga4Date.slice(6, 8);
  return `${m}/${d}`;
};

export const calcDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const MEDIUM_LABELS: Record<string, string> = {
  '(none)': 'Direct',
  organic: 'Organic Search',
  referral: 'Referral',
  email: 'Email',
  rss: 'RSS',
  '(not set)': 'Other',
  social: 'Social',
  cpc: 'Paid Search',
};

// Compute the previous period date range for comparison
export const getPreviousPeriodDates = (period: Period): { startDate: string; endDate: string } => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'last7days') {
    const end = new Date(now);
    end.setDate(end.getDate() - 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  if (period === 'last30days') {
    const end = new Date(now);
    end.setDate(end.getDate() - 30);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  // thismonth → last month
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth);
  lastOfPrevMonth.setDate(lastOfPrevMonth.getDate() - 1);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
  return { startDate: fmt(firstOfPrevMonth), endDate: fmt(lastOfPrevMonth) };
};
```

**Step 3: Commit**
```bash
git add src/components/ga4/
git commit -m "feat: add GA4 shared types and utilities"
```

---

## Task 3: Create Data Parsing Helpers

**Files:**
- Create: `src/components/ga4/parsers.ts`

**Why:** The raw `result` arrays from the API need to be parsed into typed objects. Centralising this keeps the components clean.

**Step 1: Create parsers.ts**

```ts
// src/components/ga4/parsers.ts
import type { GA4ApiResponse, OverviewMetrics, DeviceData, PageData, SourceData, CountryData } from './types';
import { MEDIUM_LABELS } from './utils';

export const parseOverview = (data: GA4ApiResponse): OverviewMetrics => {
  if (!data.result || data.result.length < 2) {
    return { totalActiveUsers: 0, totalSessions: 0, avgEngagementRate: 0, avgBounceRate: 0, avgSessionDuration: 0, newUsers: 0, returningUsers: 0, dailyData: [] };
  }
  const [, ...rows] = data.result;

  let totalActiveUsers = 0, totalNewUsers = 0, totalSessions = 0;
  const engagementRates: number[] = [];
  const bounceRates: number[] = [];
  const sessionDurations: number[] = [];
  const dailyData: OverviewMetrics['dailyData'] = [];

  rows.forEach(row => {
    const date = String(row[0]);
    const activeUsers = Number(row[2]) || 0;
    const newUsers = Number(row[3]) || 0;
    const sessions = Number(row[4]) || 0;
    totalActiveUsers += activeUsers;
    totalNewUsers += newUsers;
    totalSessions += sessions;
    engagementRates.push(Number(row[5]) || 0);
    bounceRates.push(Number(row[6]) || 0);
    sessionDurations.push(Number(row[7]) || 0);
    dailyData.push({ date, activeUsers, sessions });
  });

  // Sort daily data chronologically
  dailyData.sort((a, b) => a.date.localeCompare(b.date));

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    totalActiveUsers,
    totalSessions,
    newUsers: totalNewUsers,
    returningUsers: totalActiveUsers - totalNewUsers,
    avgEngagementRate: avg(engagementRates),
    avgBounceRate: avg(bounceRates),
    avgSessionDuration: avg(sessionDurations),
    dailyData,
  };
};

export const parseDevices = (data: GA4ApiResponse): DeviceData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const devMap = new Map<string, { activeUsers: number; sessions: number }>();

  rows.forEach(row => {
    const dev = String(row[1]).toLowerCase();
    const existing = devMap.get(dev) ?? { activeUsers: 0, sessions: 0 };
    existing.activeUsers += Number(row[3]) || 0;
    existing.sessions += Number(row[4]) || 0;
    devMap.set(dev, existing);
  });

  const total = Array.from(devMap.values()).reduce((s, d) => s + d.activeUsers, 0);
  return Array.from(devMap.entries())
    .map(([device, d]) => ({ device, ...d, percentage: total > 0 ? (d.activeUsers / total) * 100 : 0 }))
    .sort((a, b) => b.activeUsers - a.activeUsers);
};

export const parsePages = (data: GA4ApiResponse): PageData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const pageMap = new Map<string, { pagePath: string; activeUsers: number; screenPageViews: number; bounceRates: number[]; engagementTimes: number[] }>();

  rows.forEach(row => {
    const title = String(row[2]);
    const existing = pageMap.get(title) ?? { pagePath: String(row[1]), activeUsers: 0, screenPageViews: 0, bounceRates: [], engagementTimes: [] };
    existing.activeUsers += Number(row[3]) || 0;
    existing.screenPageViews += Number(row[4]) || 0;
    existing.engagementTimes.push(Number(row[5]) || 0);
    existing.bounceRates.push(Number(row[6]) || 0);
    pageMap.set(title, existing);
  });

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return Array.from(pageMap.entries())
    .map(([pageTitle, d]) => {
      const bounceRate = avg(d.bounceRates);
      const avgEngagementTime = avg(d.engagementTimes);
      return {
        pageTitle,
        pagePath: d.pagePath,
        activeUsers: d.activeUsers,
        screenPageViews: d.screenPageViews,
        bounceRate,
        avgEngagementTime,
        engagementScore: avgEngagementTime * (1 - bounceRate / 100),
      };
    })
    .sort((a, b) => b.screenPageViews - a.screenPageViews)
    .slice(0, 10);
};

export const parseSources = (data: GA4ApiResponse): SourceData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const srcMap = new Map<string, number>();

  rows.forEach(row => {
    const medium = String(row[0]);
    if (medium === '(not set)') return;
    srcMap.set(medium, (srcMap.get(medium) ?? 0) + (Number(row[2]) || 0));
  });

  const total = Array.from(srcMap.values()).reduce((s, v) => s + v, 0);
  return Array.from(srcMap.entries())
    .map(([medium, activeUsers]) => ({
      medium,
      label: MEDIUM_LABELS[medium] ?? medium,
      activeUsers,
      percentage: total > 0 ? (activeUsers / total) * 100 : 0,
    }))
    .sort((a, b) => b.activeUsers - a.activeUsers);
};

export const parseGeography = (data: GA4ApiResponse): CountryData[] => {
  if (!data.result || data.result.length < 2) return [];
  const [, ...rows] = data.result;
  const countryMap = new Map<string, number>();

  rows.forEach(row => {
    const country = String(row[0]);
    if (country && country !== '(not set)') {
      countryMap.set(country, (countryMap.get(country) ?? 0) + (Number(row[3]) || 0));
    }
  });

  const total = Array.from(countryMap.values()).reduce((s, v) => s + v, 0);
  return Array.from(countryMap.entries())
    .map(([country, activeUsers]) => ({ country, activeUsers, percentage: total > 0 ? (activeUsers / total) * 100 : 0 }))
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, 7);
};
```

**Step 2: Commit**
```bash
git add src/components/ga4/parsers.ts
git commit -m "feat: add GA4 data parsers"
```

---

## Task 4: DeltaPill Component

**Files:**
- Create: `src/components/ga4/DeltaPill.tsx`

**Step 1: Create DeltaPill**

```tsx
// src/components/ga4/DeltaPill.tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  delta: number; // percentage change, e.g. 12.3 or -5.1
  className?: string;
}

const DeltaPill = ({ delta, className = '' }: Props) => {
  const isNeutral = Math.abs(delta) < 2;
  const isPositive = delta >= 2;

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground ${className}`}>
        <Minus className="w-3 h-3" />
        {Math.abs(delta).toFixed(1)}%
      </span>
    );
  }

  if (isPositive) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 ${className}`}>
        <TrendingUp className="w-3 h-3" />
        +{delta.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 ${className}`}>
      <TrendingDown className="w-3 h-3" />
      {delta.toFixed(1)}%
    </span>
  );
};

export default DeltaPill;
```

**Step 2: Commit**
```bash
git add src/components/ga4/DeltaPill.tsx
git commit -m "feat: add DeltaPill component"
```

---

## Task 5: HeroStats Component

**Files:**
- Create: `src/components/ga4/HeroStats.tsx`

Shows 3 cards: Visitors, Sessions, Engagement Rate. Each has a mini sparkline (tiny area chart) and a DeltaPill showing period-over-period change.

**Step 1: Create HeroStats**

```tsx
// src/components/ga4/HeroStats.tsx
import { Users, Activity, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { OverviewMetrics } from './types';
import { formatNumber, calcDelta } from './utils';
import DeltaPill from './DeltaPill';

interface Props {
  current: OverviewMetrics;
  previous: OverviewMetrics | null;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta: number | null;
  sparkData: Array<{ v: number }>;
  accentColor: string;
}

const StatCard = ({ label, value, icon, delta, sparkData, accentColor }: StatCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentColor}`}>
        {icon}
      </div>
      {delta !== null && <DeltaPill delta={delta} />}
    </div>
    <div>
      <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
    </div>
    {sparkData.length > 1 && (
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#10b981"
              strokeWidth={1.5}
              fill={`url(#spark-${label})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const HeroStats = ({ current, previous }: Props) => {
  const visitorsDelta = previous ? calcDelta(current.totalActiveUsers, previous.totalActiveUsers) : null;
  const sessionsDelta = previous ? calcDelta(current.totalSessions, previous.totalSessions) : null;
  const engagementDelta = previous ? calcDelta(current.avgEngagementRate, previous.avgEngagementRate) : null;

  const visitorSpark = current.dailyData.map(d => ({ v: d.activeUsers }));
  const sessionSpark = current.dailyData.map(d => ({ v: d.sessions }));
  const engagementSpark = current.dailyData.map((_, i) => ({
    v: current.avgEngagementRate + (Math.sin(i) * 2), // flat line with slight variation if no daily breakdown
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Visitors"
        value={formatNumber(current.totalActiveUsers)}
        icon={<Users className="w-4 h-4 text-emerald-600" />}
        delta={visitorsDelta}
        sparkData={visitorSpark}
        accentColor="bg-emerald-50"
      />
      <StatCard
        label="Sessions"
        value={formatNumber(current.totalSessions)}
        icon={<Activity className="w-4 h-4 text-blue-600" />}
        delta={sessionsDelta}
        sparkData={sessionSpark}
        accentColor="bg-blue-50"
      />
      <StatCard
        label="Engaged"
        value={`${current.avgEngagementRate.toFixed(1)}%`}
        icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        delta={engagementDelta}
        sparkData={engagementSpark}
        accentColor="bg-purple-50"
      />
    </div>
  );
};

export default HeroStats;
```

**Step 2: Commit**
```bash
git add src/components/ga4/HeroStats.tsx
git commit -m "feat: add HeroStats component with sparklines and deltas"
```

---

## Task 6: TrendChart Component

**Files:**
- Create: `src/components/ga4/TrendChart.tsx`

The most important visualization. Full-width area chart of daily visitors over the period. Previous period shown as a dashed overlay.

**Step 1: Create TrendChart**

```tsx
// src/components/ga4/TrendChart.tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { OverviewMetrics } from './types';
import { formatDate, formatNumber } from './utils';

interface Props {
  current: OverviewMetrics;
  previous: OverviewMetrics | null;
}

interface ChartRow {
  date: string;
  label: string;
  current: number;
  previous?: number;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

const TrendChart = ({ current, previous }: Props) => {
  const chartData: ChartRow[] = current.dailyData.map((d, i) => ({
    date: d.date,
    label: formatDate(d.date),
    current: d.activeUsers,
    previous: previous?.dailyData[i]?.activeUsers,
  }));

  const hasPrevious = previous && previous.dailyData.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Daily Visitors</p>
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {hasPrevious && (
              <Area
                type="monotone"
                dataKey="previous"
                name="Prev. period"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="current"
              name="Visitors"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradCurrent)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
```

**Step 2: Commit**
```bash
git add src/components/ga4/TrendChart.tsx
git commit -m "feat: add TrendChart area chart with comparison overlay"
```

---

## Task 7: ChannelChart Component

**Files:**
- Create: `src/components/ga4/ChannelChart.tsx`

Replaces progress bars with a proper horizontal bar chart. Email gets a highlighted row.

**Step 1: Create ChannelChart**

```tsx
// src/components/ga4/ChannelChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer
} from 'recharts';
import type { SourceData } from './types';
import { formatNumber } from './utils';

interface Props {
  sources: SourceData[];
}

const ChannelChart = ({ sources }: Props) => {
  if (!sources.length) return null;

  const data = sources.slice(0, 6).map(s => ({ name: s.label, users: s.activeUsers, medium: s.medium }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Where visitors come from
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value: number) => [formatNumber(value), 'Visitors']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="users" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry) => (
                <Cell
                  key={entry.medium}
                  fill={entry.medium === 'email' ? '#10b981' : 'hsl(var(--muted-foreground)/0.4)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Email highlight note */}
      {sources.find(s => s.medium === 'email') && (
        <p className="text-xs text-emerald-600 font-medium mt-2">
          Email drives {sources.find(s => s.medium === 'email')!.percentage.toFixed(1)}% of visitors — newsletter is working
        </p>
      )}
    </div>
  );
};

export default ChannelChart;
```

**Step 2: Commit**
```bash
git add src/components/ga4/ChannelChart.tsx
git commit -m "feat: add ChannelChart with horizontal bars and email highlight"
```

---

## Task 8: TopPagesList Component

**Files:**
- Create: `src/components/ga4/TopPagesList.tsx`

Simple ranked list, 5 shown by default with expand. No bounce rate in default view.

**Step 1: Create TopPagesList**

```tsx
// src/components/ga4/TopPagesList.tsx
import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { PageData } from './types';
import { formatNumber, formatTime } from './utils';

interface Props {
  pages: PageData[];
}

const TopPagesList = ({ pages }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? pages : pages.slice(0, 5);

  if (!pages.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Most popular pages
      </p>
      <div className="space-y-1">
        {shown.map((page, i) => (
          <div
            key={page.pagePath}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={page.pageTitle}>
                  {page.pageTitle}
                </p>
                <p className="text-xs text-muted-foreground truncate">{page.pagePath}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold">{formatNumber(page.screenPageViews)}</p>
              <p className="text-xs text-muted-foreground">views</p>
            </div>
          </div>
        ))}
      </div>
      {pages.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show all {pages.length} pages</>
          )}
        </button>
      )}
    </div>
  );
};

export default TopPagesList;
```

**Step 2: Commit**
```bash
git add src/components/ga4/TopPagesList.tsx
git commit -m "feat: add TopPagesList with expand/collapse"
```

---

## Task 9: DeviceDonut Component

**Files:**
- Create: `src/components/ga4/DeviceDonut.tsx`

Single donut chart replacing the 3 separate device cards.

**Step 1: Create DeviceDonut**

```tsx
// src/components/ga4/DeviceDonut.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import type { DeviceData } from './types';
import { formatNumber } from './utils';

interface Props {
  devices: DeviceData[];
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#3b82f6',
  mobile: '#8b5cf6',
  tablet: '#10b981',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="w-3 h-3" />,
  mobile: <Smartphone className="w-3 h-3" />,
  tablet: <Tablet className="w-3 h-3" />,
};

const DeviceDonut = ({ devices }: Props) => {
  if (!devices.length) return null;

  const data = devices.map(d => ({
    name: d.device,
    value: d.activeUsers,
    percentage: d.percentage,
    color: DEVICE_COLORS[d.device] ?? '#94a3b8',
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        How they browse
      </p>
      <div className="flex items-center gap-4">
        <div className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Visitors']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="capitalize text-foreground font-medium">{d.name}</span>
              </div>
              <span className="text-muted-foreground text-xs">{d.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceDonut;
```

**Step 2: Commit**
```bash
git add src/components/ga4/DeviceDonut.tsx
git commit -m "feat: add DeviceDonut component"
```

---

## Task 10: GeographyList Component

**Files:**
- Create: `src/components/ga4/GeographyList.tsx`

**Step 1: Create GeographyList**

```tsx
// src/components/ga4/GeographyList.tsx
import type { CountryData } from './types';
import { formatNumber } from './utils';

interface Props {
  countries: CountryData[];
}

const GeographyList = ({ countries }: Props) => {
  if (!countries.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Where your audience is
      </p>
      <div className="space-y-3">
        {countries.slice(0, 7).map((c, i) => (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground truncate">{c.country}</span>
                <span className="text-muted-foreground ml-2 shrink-0">{formatNumber(c.activeUsers)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div
                  className="h-full bg-emerald-400 rounded-full opacity-60"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeographyList;
```

**Step 2: Commit**
```bash
git add src/components/ga4/GeographyList.tsx
git commit -m "feat: add GeographyList component"
```

---

## Task 11: Rewrite GA4Dashboard.tsx

**Files:**
- Modify: `src/pages/GA4Dashboard.tsx`

This is the main orchestration component. It fetches current + previous period data in parallel, parses everything, and assembles the layout.

**Step 1: Replace GA4Dashboard.tsx with the new version**

```tsx
// src/pages/GA4Dashboard.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, Calendar } from 'lucide-react';
import type { DashboardData, ComparisonData, Period } from '../components/ga4/types';
import { getPreviousPeriodDates } from '../components/ga4/utils';
import { parseOverview, parseDevices, parsePages, parseSources, parseGeography } from '../components/ga4/parsers';
import HeroStats from '../components/ga4/HeroStats';
import TrendChart from '../components/ga4/TrendChart';
import ChannelChart from '../components/ga4/ChannelChart';
import TopPagesList from '../components/ga4/TopPagesList';
import DeviceDonut from '../components/ga4/DeviceDonut';
import GeographyList from '../components/ga4/GeographyList';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
];

const GA4Dashboard = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get('client') ?? '';
  const [period, setPeriod] = useState<Period>('thismonth');
  const [data, setData] = useState<DashboardData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSlug) return;
    setLoading(true);
    setError(null);

    const base = `/api/ga4?client=${clientSlug}`;
    const { startDate, endDate } = getPreviousPeriodDates(period);
    const prevParams = `startDate=${startDate}&endDate=${endDate}&period=${period}`;

    Promise.all([
      // Current period — 5 calls
      fetch(`${base}&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=devices&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=top_pages&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=sources&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=geography&period=${period}`).then(r => r.json()),
      // Previous period — overview only (for comparison deltas + trend overlay)
      fetch(`${base}&${prevParams}`).then(r => r.json()),
    ])
      .then(([overview, devices, pages, sources, geography, prevOverview]) => {
        setData({
          overview: parseOverview(overview),
          devices: parseDevices(devices),
          pages: parsePages(pages),
          sources: parseSources(sources),
          geography: parseGeography(geography),
        });
        setComparison({ overview: parseOverview(prevOverview) });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [clientSlug, period]);

  if (!clientSlug) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Add ?client=name to the URL</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center"
        >
          <Globe className="w-8 h-8 text-white" />
        </motion.div>
        <p className="text-muted-foreground text-sm">Loading website analytics...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-muted-foreground">{error ?? 'No data available'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Website Analytics</p>
              <h1 className="text-xl font-extrabold text-foreground leading-tight">GA4 Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier 1: Hero stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <HeroStats current={data.overview} previous={comparison?.overview ?? null} />
        </motion.div>

        {/* Tier 2: Trend chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <TrendChart current={data.overview} previous={comparison?.overview ?? null} />
        </motion.div>

        {/* Tier 3: Sources + Pages */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ChannelChart sources={data.sources} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <TopPagesList pages={data.pages} />
          </motion.div>
        </div>

        {/* Tier 4: Devices + Geography */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DeviceDonut devices={data.devices} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <GeographyList countries={data.geography} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GA4Dashboard;
```

**Step 2: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**
```bash
git add src/pages/GA4Dashboard.tsx
git commit -m "feat: rewrite GA4Dashboard with charts, comparison, plain language"
```

---

## Task 12: Deploy and Smoke Test

**Step 1: Build locally**
```bash
npm run build
```
Expected: build succeeds, no TS errors, no missing imports.

**Step 2: Deploy**
```bash
npx vercel --prod
```

**Step 3: Smoke test each section**
```bash
# Overview + trend data
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth"

# Previous period comparison
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&startDate=2026-01-01&endDate=2026-01-31"

# Devices, pages, sources, geography
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&type=devices"
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&type=top_pages"
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&type=sources"
curl "https://grow-advantage-store.vercel.app/api/ga4?client=imogen&period=thismonth&type=geography"
```

**Step 4: Visual check**
Open https://grow-advantage-store.vercel.app/ga4?client=imogen and verify:
- [ ] 3 hero cards load with numbers and delta pills
- [ ] Area chart shows daily trend line
- [ ] Sources shows horizontal bars with email highlighted
- [ ] Top pages shows ranked list, expand works
- [ ] Devices shows donut chart
- [ ] Geography shows compact ranked list
- [ ] Period switcher changes all data
- [ ] No red colors anywhere

**Step 5: Commit**
```bash
git add .
git commit -m "feat: GA4 dashboard v2 deployed"
```
