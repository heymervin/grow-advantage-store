-- ============================================================
-- Grow Advantage Client Portal — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. CLIENTS TABLE
-- Stores client profiles displayed on the dashboard
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,               -- URL parameter: ?client=imogen
  name TEXT NOT NULL,                       -- "Imogen's Business"
  integrator_name TEXT DEFAULT '',          -- Team member assigned
  primary_comms_channel TEXT DEFAULT '',    -- e.g. "Slack", "Voxer"
  next_strategy_meeting TEXT DEFAULT '',    -- Free text date/time
  -- "This Month at a Glance" fields
  this_month_outcomes TEXT DEFAULT '',
  this_month_deliverables TEXT DEFAULT '',
  this_month_improvements TEXT DEFAULT '',
  this_month_risks TEXT DEFAULT '',
  this_month_focus TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MONTHLY SNAPSHOTS TABLE
-- Each row = one Monthly Snapshot page for a client
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  month_label TEXT NOT NULL,                -- "February 2026"
  month_slug TEXT NOT NULL,                 -- "february-2026"

  -- Section 1: Meeting Details
  meeting_date TEXT DEFAULT '',
  attendees TEXT DEFAULT '',

  -- Section 3: Agreement Snapshot (array of {item, inclusion, notes})
  agreement_snapshot JSONB DEFAULT '[
    {"item": "Monthly strategic meeting", "inclusion": "1x per month", "notes": ""},
    {"item": "Integrator support", "inclusion": "~7 hrs/week", "notes": ""},
    {"item": "Offshore ops support", "inclusion": "up to ~7 hrs/week", "notes": ""},
    {"item": "Tracking", "inclusion": "Time tracked weekly + reviewed weekly", "notes": ""},
    {"item": "Escalation flags", "inclusion": "overrun / scope creep / shifting priorities / too strategic", "notes": ""}
  ]',

  -- Section 4: Previous Month Review
  wins TEXT DEFAULT '',
  deliverables_completed TEXT DEFAULT '',
  slipped TEXT DEFAULT '',
  insights TEXT DEFAULT '',

  -- Section 5: Upcoming Month
  upcoming_priorities JSONB DEFAULT '[
    {"outcome": "", "owner": "", "due": "", "notes": ""},
    {"outcome": "", "owner": "", "due": "", "notes": ""},
    {"outcome": "", "owner": "", "due": "", "notes": ""}
  ]',
  key_deadlines TEXT DEFAULT '',
  risks_constraints TEXT DEFAULT '',

  -- Section 6: Process Improvements (array of {project, status, priority, owner, next_step, notes})
  process_improvements JSONB DEFAULT '[]',

  -- Section 7: Ad hoc Requests (array of {request, owner, due, notes})
  adhoc_requests JSONB DEFAULT '[]',

  -- Section 8: Communication
  primary_comms TEXT DEFAULT '',
  recurring_meetings JSONB DEFAULT '[
    {"meeting": "Monthly Strategy", "cadence": "Monthly", "time": "", "notes": ""}
  ]',
  response_times TEXT DEFAULT '',

  -- Section 9: Client Feedback
  working_well TEXT DEFAULT '',
  unclear_messy TEXT DEFAULT '',
  more_visibility TEXT DEFAULT '',
  priorities_score INT DEFAULT 0,
  delivery_score INT DEFAULT 0,
  communication_score INT DEFAULT 0,
  capacity_score INT DEFAULT 0,

  -- Section 10: Decisions & Actions (array of {type, item, owner, due, status})
  decisions_actions JSONB DEFAULT '[]',
  blockers TEXT DEFAULT '',

  -- Efficiency / Impact Notes
  time_saved TEXT DEFAULT '',
  friction_removed TEXT DEFAULT '',
  systems_implemented TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, month_slug)
);

-- 3. ADD-ONS TABLE
-- Dynamic service catalogue replacing the static services data
CREATE TABLE IF NOT EXISTS addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  timeline TEXT DEFAULT '',
  features JSONB DEFAULT '[]',           -- array of strings
  what_you_get JSONB DEFAULT '[]',       -- array of strings
  cta_text TEXT DEFAULT 'Learn More',
  cta_link TEXT DEFAULT '#',
  icon_name TEXT DEFAULT 'Package',      -- Lucide icon name
  badge TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Allow public read on all tables (anon key)
CREATE POLICY "Allow public read on clients"
  ON clients FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on snapshots"
  ON monthly_snapshots FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read on addons"
  ON addons FOR SELECT TO anon USING (true);

-- Allow anon insert/update/delete (admin uses anon key)
CREATE POLICY "Allow anon write on clients"
  ON clients FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon write on snapshots"
  ON monthly_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon write on addons"
  ON addons FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. SEED DATA — Two test clients
INSERT INTO clients (slug, name, integrator_name, primary_comms_channel, next_strategy_meeting, this_month_outcomes, this_month_deliverables, this_month_improvements, this_month_risks, this_month_focus)
VALUES
  ('imogen', 'Imogen', 'Chrissy Elle', 'Slack + Voxer', 'March 5, 2026 — 10:00am AEST',
   'Onboarding complete, SOPs handed over, first workflow live',
   'Client welcome pack, SOP library v1, Asana workspace',
   'Moved from manual invoicing to automated billing',
   'Capacity stretch on offshore team next month',
   'Embedding SOPs + first full month of delivery'),
  ('chantal', 'Chantal', 'Chrissy Elle', 'Slack', 'March 7, 2026 — 2:00pm AEST',
   'CRM migration completed, email sequences live',
   'CRM setup, 3x email sequences, lead magnet funnel',
   'Consolidated 3 tools into single CRM',
   'Launch timeline tight for April campaign',
   'Campaign prep + content pipeline setup');

-- Seed a sample monthly snapshot for Imogen
INSERT INTO monthly_snapshots (
  client_id, month_label, month_slug, meeting_date, attendees,
  wins, deliverables_completed, slipped, insights,
  key_deadlines, risks_constraints,
  primary_comms, response_times,
  working_well, unclear_messy, more_visibility,
  priorities_score, delivery_score, communication_score, capacity_score,
  time_saved, friction_removed, systems_implemented
)
SELECT
  id,
  'February 2026', 'february-2026',
  'February 6, 2026', 'Imogen, Chrissy, VA Team',
  'Onboarding landed smoothly. All SOPs transferred within 2 weeks.',
  'Client welcome pack delivered. SOP library v1 complete. Asana workspace configured.',
  'Video editing turnaround was slower than expected — resolved by adding a second editor.',
  'Starting with SOPs first (before automation) builds team confidence faster.',
  'March 10 — SOP review deadline. March 15 — Workflow automation go-live.',
  'Offshore capacity may need +5hrs in March if new client onboards.',
  'Slack (async daily), Voxer (urgent), Zoom (monthly strategy)',
  'Slack: same-day response. Voxer: within 2hrs during business hours. Email: 24hrs.',
  'Communication cadence feels right. Love the async-first approach.',
  'Would like more visibility into offshore team task allocation.',
  'A simple weekly dashboard or update on what offshore completed.',
  8, 9, 9, 7,
  '~6 hours saved this month via SOP automation',
  'Manual client onboarding checklist replaced with automated workflow',
  'Asana project templates, automated welcome sequence'
FROM clients WHERE slug = 'imogen';

-- Seed existing services as add-ons
INSERT INTO addons (title, short_description, description, price, timeline, features, what_you_get, cta_text, cta_link, icon_name, badge, sort_order)
VALUES
  ('VIP Day Strategic Deepdive',
   'A focused reset for when leadership, delivery, or team decisions feel urgent.',
   'You don''t need more ideas. You need decisions made, pressure reduced, and a structure that actually holds your business.',
   '$2,997 AUD', '1 Day (90min + Build)',
   '["90-minute strategy session", "Full service day of done-for-you work", "Google Drive folder with recommendations", "Hiring plan + revenue map + org structure", "CEO role clarity + templates"]',
   '["Perfect for: Coaches, educators, agencies, trades & service providers", "Only two VIP Days per month available", "Payment plans available"]',
   'Book Your VIP Day Now',
   'https://links.growadvantage.com.au/widget/bookings/grow-advantage-vip-day',
   'Star', 'VIP', 1),

  ('Operations Partnership',
   'Your Business, Upgraded from the Inside Out.',
   'When you''ve outgrown being your own operations manager, we provide strategy, delivery, and leadership.',
   'Starting at $547 AUD/week', 'Minimum 12-week engagement',
   '["Strategic COO Support — monthly vision + roadmap", "Dedicated Integrator running daily ops", "Team of Offshore Experts managed for you"]',
   '["Within 30 days: reclaim 10+ hours a week", "By 90 days: your business runs without you"]',
   'Let''s Map Your First 90 Days',
   'https://links.growadvantage.com.au/widget/bookings/sanity-call',
   'Settings', 'MOST POPULAR', 2),

  ('Leadership Support',
   'One-to-one thinking partnership for leaders and business owners.',
   'For founders who need somewhere to think clearly, make decisions, and deal with leadership in real time.',
   'Starting at $799 AUD/month', '3 months minimum',
   '["Leadership load and responsibility creep", "Team dynamics and structure", "Decisions affecting time, energy, income", "Capacity, boundaries, and role clarity"]',
   '["No group calls", "No hype", "No theory without application", "Ongoing 1:1 support"]',
   'Enquire About 1:1 Support',
   'https://links.growadvantage.com.au/widget/bookings/sanity-call',
   'HeartHandshake', '', 3),

  ('Strategy Sessions',
   'A 60 minute deep-dive to untangle a specific challenge or map a project.',
   'Perfect for founders who need clarity fast on a specific challenge.',
   '$497 AUD', '60 Minutes',
   '["Untangle a specific challenge", "Map a project", "Get clarity fast"]',
   '["Deep-dive session", "Actionable next steps"]',
   'Book Your Strategy Session',
   'https://links.growadvantage.com.au/widget/bookings/60min-strategy-session-chrissy-elle',
   'MessageCircle', '', 4),

  ('Hiring Projects',
   'Done-for-you recruitment for Integrators, VAs, and delivery teams.',
   'Full recruitment with role clarity and onboarding built in.',
   'Custom Quote', 'Project Based',
   '["Done-for-you recruitment", "Role clarity included", "Onboarding built in"]',
   '["Professional recruitment process", "Vetted candidates", "Time saved on hiring"]',
   'Request a Quote',
   'https://links.growadvantage.com.au/widget/bookings/sanity-call',
   'UserPlus', '', 5),

  ('Operations & Systems Projects',
   'CRM migrations, process audits, and system builds.',
   'We''ll create systems that save time and headspace.',
   'Custom Quote', 'Project Based',
   '["CRM migrations", "Process audits", "System optimization"]',
   '["Systems that save time", "Streamlined operations"]',
   'Enquire About Systems Projects',
   'https://links.growadvantage.com.au/widget/bookings/sanity-call',
   'Wrench', '', 6);
