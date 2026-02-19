# Multi-Property GA4 Dashboard Design

**Date:** 2026-02-19
**Status:** Approved
**Context:** Imogen (Chrissy's client) has 8 GA4 properties representing different websites. The dashboard needs to show both an aggregated "all properties" view and allow drilling down into individual properties.

---

## Problem Statement

Currently, the GA4 dashboard aggregates all properties for a client into one combined view. This works for getting totals, but provides no visibility into:
- Which individual websites are performing well/poorly
- Ability to drill down into a specific property's analytics
- Quick comparison between properties

**User need:** Chrissy (or Imogen) needs to see both the big picture (all 8 sites combined) and individual site performance without navigating to different URLs.

---

## Design Solution

### Two Viewing Modes

**Mode 1: "All Properties" (Default)**
- Aggregates data from all properties belonging to the client
- Shows combined hero stats (total active users, sessions, etc.)
- Shows combined charts and trends
- **NEW:** Adds a "Property Breakdown" table showing each property's individual metrics
  - Allows quick identification of top/bottom performers
  - Sortable by any metric column
  - Click property name → switches to that property's detailed view

**Mode 2: "Single Property View"**
- Filters all data to one specific property
- Same dashboard components, just scoped to that property
- All existing charts, tables, and widgets work as-is with filtered data
- No breakdown table shown (unnecessary when viewing one property)

### UI/UX Design

**Header Controls:**
```
┌──────────────────────────────────────────────┐
│ 🌐 GA4 Website Analytics                    │
│                                              │
│ [All Properties ▼]  [Last 7 Days ▼]        │
└──────────────────────────────────────────────┘
```

**Property Selector Dropdown:**
- First option: "All Properties" (default)
- Subsequent options: Individual properties listed by name
  - Example: "insideoutstylemember.com G4"
  - Example: "AOPI G4"
- Selection updates React state only (not URL)
- Triggers data re-fetch with property filter

**Property Breakdown Table (when viewing "All Properties"):**
- Appears immediately after hero stats section
- Columns:
  - Property Name (clickable)
  - Active Users
  - Sessions
  - Engagement Rate (%)
  - Bounce Rate (%)
- Sortable by any column
- Click property name → sets selectedProperty state → dashboard updates to show that property

### URL Structure

- URL format: `?client=imogen`
- The `client` param determines which properties are available (access control)
- Property selection is **UI state only**, not reflected in URL
- This keeps URLs simple and shareable

### Architecture

**Frontend (React):**
- Add `selectedProperty` state to `GA4DashboardContent.tsx`
- New component: `PropertySelector.tsx` (dropdown)
- New component: `PropertyBreakdownTable.tsx` (shows all properties when viewing "All")
- Modify existing components to conditionally show breakdown table
- When property selected: append `&property={id}` to all API calls
- When "All Properties": no property param (current behavior)

**Backend (API):**
- Endpoint: `/api/ga4` (existing, minor modification)
- Current behavior: `GET /api/ga4?client=imogen&period=thismonth`
  - Queries all properties, returns aggregated data
- New behavior: `GET /api/ga4?client=imogen&period=thismonth&property=251613729`
  - Queries only specified property, returns that property's data
- Response format enhancement:
  ```json
  {
    "result": [...existing data format...],
    "propertyBreakdown": [
      {
        "property_id": "251613729",
        "property_name": "insideoutstylemember.com G4",
        "activeUsers": 1234,
        "sessions": 5678,
        "engagementRate": 45.2,
        "bounceRate": 32.1
      }
      // ... more properties
    ]
  }
  ```
- `propertyBreakdown` only included when no `property` param specified (viewing "All Properties")

**New endpoint: `/api/ga4-properties`**
- Purpose: Fetch available properties for property selector dropdown
- Format: `GET /api/ga4-properties?client=imogen`
- Response:
  ```json
  {
    "properties": [
      { "property_id": "251613729", "property_name": "insideoutstylemember.com G4" },
      { "property_id": "251632190", "property_name": "Bespoke Image G4" }
      // ... more
    ]
  }
  ```
- Just queries `client_ga4_connections` table filtered by client_slug

### Data Flow

1. User visits `?client=imogen`
2. Dashboard loads with `selectedProperty = null` (All Properties mode)
3. Fetches data from `/api/ga4?client=imogen&period=thismonth` (all 12 query types)
4. Fetches available properties from `/api/ga4-properties?client=imogen`
5. Displays aggregated data + property breakdown table
6. User selects a property from dropdown
7. Sets `selectedProperty = {id}` in React state
8. Re-fetches all data with `&property={id}` appended
9. Dashboard updates to show single property view
10. Breakdown table hidden (not needed for single property)

### Component Changes

**New Components:**

1. **PropertySelector.tsx**
   ```tsx
   interface Props {
     clientSlug: string;
     selectedProperty: string | null;
     onPropertyChange: (propertyId: string | null) => void;
   }
   ```
   - Fetches available properties on mount
   - Renders dropdown with "All Properties" + individual properties
   - Calls `onPropertyChange` when selection changes

2. **PropertyBreakdownTable.tsx**
   ```tsx
   interface Props {
     properties: PropertyBreakdownRow[];
     onPropertyClick: (propertyId: string) => void;
   }

   interface PropertyBreakdownRow {
     property_id: string;
     property_name: string;
     activeUsers: number;
     sessions: number;
     engagementRate: number;
     bounceRate: number;
   }
   ```
   - Renders sortable table
   - Click property name → calls `onPropertyClick`

**Modified Components:**

1. **GA4DashboardContent.tsx**
   - Add state: `const [selectedProperty, setSelectedProperty] = useState<string | null>(null)`
   - Add PropertySelector to header
   - Append `&property=${selectedProperty}` to all API calls when selectedProperty is set
   - Parse `propertyBreakdown` from API response
   - Conditionally render PropertyBreakdownTable when `selectedProperty === null`

**No changes needed:**
- All existing chart/table components (HeroStats, TrendChart, etc.)
- They receive filtered data from the API and render as usual

### API Implementation Changes

**Modify `/api/ga4.ts`:**

1. Accept optional `property` query param
2. When `property` specified:
   - Filter `connections` array to only that property_id
   - Query only that property
   - Return data without `propertyBreakdown` field
3. When `property` NOT specified:
   - Query all properties (current behavior)
   - Aggregate results (current behavior)
   - **NEW:** Calculate per-property metrics and include in `propertyBreakdown` field
4. Property breakdown calculation:
   - For each property, compute: activeUsers, sessions, engagementRate, bounceRate
   - Return array of objects with property_id, property_name, and metrics

**Create `/api/ga4-properties.ts`:**
```typescript
// Simple endpoint to list available properties for a client
export default async function handler(req, res) {
  const client = req.query.client;
  const { data } = await supabase
    .from('client_ga4_connections')
    .select('property_id, property_name')
    .eq('client_slug', client);

  return res.json({ properties: data });
}
```

### Error Handling

- **Property with no data:** Show empty state message in single property view
- **API fails for one property:** In breakdown table, show error indicator for that property, continue loading others
- **Invalid property ID:** If selectedProperty doesn't exist in available properties, reset to "All Properties"
- **Client has 0 properties:** Show "No properties connected" message with link to `/connect`

### Testing Strategy

**Manual testing:**
1. Verify "All Properties" shows aggregated data + breakdown table
2. Verify selecting a property filters dashboard to that property only
3. Verify clicking property name in breakdown table switches to that property
4. Verify switching back to "All Properties" restores aggregated view
5. Verify period selector works in both modes
6. Verify all chart types render correctly in both modes

**Edge cases:**
- Client with 1 property (selector should still work, just show 1 option)
- Client with 0 properties (show empty state)
- Property with zero traffic (should show zeros, not error)

---

## Benefits

✅ **Maintains current functionality** - "All Properties" aggregated view is default
✅ **Adds granular visibility** - Can drill down to individual properties
✅ **Quick performance comparison** - Breakdown table shows all properties at a glance
✅ **Minimal complexity** - Reuses existing components, simple state management
✅ **No URL bloat** - Property selection is UI state only
✅ **Scalable** - Works with 1 property or 100 properties

---

## Future Enhancements (Out of Scope)

- Property comparison mode (select 2+ properties, show side-by-side)
- Property grouping/tagging (e.g., "Blogs", "Main Sites")
- Property-specific notes or alerts
- Export breakdown table to CSV
- Saved property selections per user

---

## Implementation Plan

Will be created using the `writing-plans` skill to break this design into concrete implementation tasks.
