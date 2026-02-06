// ---- Client ----
export interface Client {
  id: string;
  slug: string;
  name: string;
  integrator_name: string;
  primary_comms_channel: string;
  next_strategy_meeting: string;
  this_month_outcomes: string;
  this_month_deliverables: string;
  this_month_improvements: string;
  this_month_risks: string;
  this_month_focus: string;
  created_at: string;
  updated_at: string;
}

// ---- Monthly Snapshot ----
export interface AgreementItem {
  item: string;
  inclusion: string;
  notes: string;
}

export interface PriorityItem {
  outcome: string;
  owner: string;
  due: string;
  notes: string;
}

export interface ProcessItem {
  project: string;
  status: string;
  priority: string;
  owner: string;
  next_step: string;
  notes: string;
}

export interface AdhocItem {
  request: string;
  owner: string;
  due: string;
  notes: string;
}

export interface MeetingItem {
  meeting: string;
  cadence: string;
  time: string;
  notes: string;
}

export interface DecisionItem {
  type: string;
  item: string;
  owner: string;
  due: string;
  status: string;
}

export interface MonthlySnapshot {
  id: string;
  client_id: string;
  month_label: string;
  month_slug: string;
  meeting_date: string;
  attendees: string;
  agreement_snapshot: AgreementItem[];
  wins: string;
  deliverables_completed: string;
  slipped: string;
  insights: string;
  upcoming_priorities: PriorityItem[];
  key_deadlines: string;
  risks_constraints: string;
  process_improvements: ProcessItem[];
  adhoc_requests: AdhocItem[];
  primary_comms: string;
  recurring_meetings: MeetingItem[];
  response_times: string;
  working_well: string;
  unclear_messy: string;
  more_visibility: string;
  priorities_score: number;
  delivery_score: number;
  communication_score: number;
  capacity_score: number;
  decisions_actions: DecisionItem[];
  blockers: string;
  time_saved: string;
  friction_removed: string;
  systems_implemented: string;
  created_at: string;
  updated_at: string;
}

// ---- Add-on ----
export interface Addon {
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: string;
  timeline: string;
  features: string[];
  what_you_get: string[];
  cta_text: string;
  cta_link: string;
  icon_name: string;
  badge: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
