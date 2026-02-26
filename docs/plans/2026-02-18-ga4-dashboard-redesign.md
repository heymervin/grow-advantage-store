# GA4 Dashboard Redesign — Design Document
**Date:** 2026-02-18
**Client:** Imogen / 16 Style Types
**Input from:** Data Analyst, Business Ops Manager, Imogen (client), UX/UI Expert

---

## Problem with the Current Dashboard

The existing `/ga4` dashboard is a solid V1 but has three fundamental problems:
1. **Static snapshots only** — no period-over-period comparison, so every number is context-free
2. **Missing the most valuable visualization** — daily trend chart data exists in the API but isn't charted
3. **Google Analytics aesthetics** — the thing Imogen said she specifically doesn't want

---

## Design Principles (from Imogen directly)

1. **"Answer my questions in under 30 seconds"** — No filtering required, no clicking around
2. **"Tell me a story, not a spreadsheet"** — Delta-first, narrative over raw numbers
3. **"Plain language"** — "Visitors" not "active users", "Where people came from" not "acquisition channels"
4. **"Show me what changed"** — Deltas and trends are more important than absolutes
5. **Content-first framing** — This is a content/membership business, not e-commerce

---

## Layout: Top-to-Bottom Hierarchy

### Section 1: Hero Stats (3 cards)
The first thing Imogen sees. Three numbers, big and confident.

| Card | Metric | Source |
|------|--------|--------|
| Visitors | `activeUsers` (total for period) | API overview |
| Sessions | `sessions` (total) | API overview |
| Engagement | `engagementRate` (avg %) | API overview |

Each card includes:
- Large number (primary)
- Mini sparkline (7-point trend from daily data)
- Period-over-period delta pill: `+12%` in emerald, `-5%` in amber

**New vs Returning split** shown as a subtle secondary line under Visitors card.

### Section 2: Daily Trend Chart (full width)
The most important visualization. Currently unused — daily data is available from the API.

- Recharts `AreaChart` via shadcn `ChartContainer`
- Soft gradient fill, teal/green palette
- Previous period as dashed overlay line
- Hover tooltip: date, visitors, sessions
- No legend needed for previous period — tooltip handles it

### Section 3: Two-column — Sources + Top Pages
**Left: Where visitors come from**
- Recharts horizontal `BarChart` (not progress bars)
- Show: Direct, Organic Search, Email, Referral
- **Email gets a highlighted row** — it's the heartbeat metric for this business
- Period comparison arrow per source

**Right: Most popular pages**
- Simple ranked list (not a table)
- Show: title + view count only
- Max 5 shown by default, "Show all →" expands inline
- Sort by screenPageViews
- Bounce rate removed from default view (shown in expanded detail only)

### Section 4: Two-column — Devices + Geography
**Left: How they browse**
- Single donut/ring chart (Recharts `PieChart`)
- Replaces 3 separate device cards
- Desktop / Mobile / Tablet with percentages

**Right: Where your audience is**
- Compact ranked list, top 5 countries
- Subtle inline bars, not full progress bars
- No more than 5 shown (rest collapsed)

---

## Key Metric Changes from V1

| V1 | New Dashboard | Reason |
|----|---------------|--------|
| 6 overview metrics in one card | 3 hero stat cards | Less = more for non-data person |
| No trend chart | Full-width area chart | Most important missing feature |
| Bounce rate prominent | Removed from default view | Negative framing, replaced by engagement rate |
| Avg session duration prominent | Moved to tooltip/secondary | Meaningless without context |
| 3 device cards | Single donut chart | More compact, same info |
| Progress bars for sources | Horizontal bar chart | More legible for comparison |
| No period comparison | Delta pills + dashed chart overlay | Transforms every metric from static to meaningful |
| "Traffic Sources" header | "Where visitors come from" | Plain language |
| "Top Countries" header | "Where your audience is" | Plain language |

---

## New Data Requirements

### Period Comparison (requires second API call)
The API needs to accept a `compareWith=previous` param (or the frontend makes two calls). For each period:
- Last 7 days → compare to prior 7 days
- Last 30 days → compare to prior 30 days
- This month → compare to last month

### Derived Metrics (frontend calculations from existing data)
- **Returning users** = `activeUsers - newUsers`
- **Email traffic %** = email activeUsers / total activeUsers (from sources data)
- **Organic traffic %** = organic activeUsers / total (from sources data)
- **Engagement score per page** = `avgEngagementTime × (1 - bounceRate/100)`

### Sparklines (from existing daily data)
The API already returns daily data — the frontend aggregates it into totals and discards it. Instead, keep the daily array to render sparklines on stat cards and the main area chart.

---

## Color System

| State | Color | Usage |
|-------|-------|-------|
| Growth / positive | `emerald-600` / `emerald-50` bg | `+12%` delta pills, up arrows |
| Neutral / stable | `muted-foreground` | `±2%` no significant change |
| Attention / decline | `amber-600` / `amber-50` bg | `-15%` delta pills, down arrows |
| Never use | `red-*` | This is a reporting tool, not an error log |

---

## Standalone KPI Cards (new, promoted from buried)

Two additional stat cards alongside or below the hero section:

**Email Traffic**
- Value: `287 visitors from email (23%)`
- Delta: `+8% vs last month`
- Framing: "Newsletter engagement" not "email medium"

**Organic Search**
- Value: `312 visitors from search (25%)`
- Delta: `↑8.2% — SEO is working`
- Framing: "Search discovery" not "organic medium"

These two are the most actionable channel metrics for Imogen's business model.

---

## What to Remove / Not Build

| Feature | Decision |
|---------|----------|
| Bounce rate (default view) | Remove — use engagement rate instead |
| Real-time visitors | Don't add — "anxiety-inducing" per Imogen |
| Detailed demographics (age/gender) | Don't add — GA4 has it but Imogen already knows her audience |
| Session duration as isolated stat | Demote to tooltip |
| Device breakdown as 3 separate cards | Replace with single donut |
| "Property Overview" section header | Remove — hero stats speak for themselves |
| 10-column page table on mobile | Replace with card list on mobile |

---

## Mobile Layout

Imogen checks this on her phone. All sections stack to single column:
- Hero stats: 1 column, full width
- Trend chart: full width, touch tooltips
- Sources + Pages: stacked vertically
- Devices donut + Geography: stacked vertically
- Period selector: short labels (7D / 30D / MTD)

---

## Future / Phase 2 (not this sprint)

- Content category grouping by URL pattern
- Landing pages report (entry points vs top pages)
- New vs returning user filter across entire dashboard
- Scroll depth events (if GA4 enhanced measurement enabled)
- Conversion events (newsletter signups, course purchases) — requires goal setup in GA4
- Auto-generated weekly narrative: "Traffic up 12%, mostly from organic. Top page: ENFJ guide."

---

## Component Inventory

All charts use existing shadcn/ui chart wrappers (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`).

| Component | Recharts Base | shadcn Wrapper |
|-----------|--------------|----------------|
| Daily trend | `AreaChart` | `ChartContainer` |
| Sparklines | `AreaChart` (miniaturized) | Inline, no container |
| Sources bar | `BarChart layout="vertical"` | `ChartContainer` |
| Devices donut | `PieChart` | `ChartContainer` |

---

## Success Criteria

Imogen opens the dashboard on a Monday morning and within 20 seconds can answer:
1. Is my traffic up or down this week?
2. Which article is getting the most attention right now?
3. Is my email newsletter driving people back to my site?

If those three are answerable in one scroll without clicking anything, the dashboard is working.
