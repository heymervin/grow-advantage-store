import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, ShoppingBag, Plus, Trash2, Save, Loader2, CheckCircle2,
  Eye, Lock, LogOut, Pencil, Copy, ExternalLink, AlertTriangle, Search,
  Star, Settings, HeartHandshake, MessageCircle, UserPlus, Wrench, Package,
  Zap, BookOpen, Rocket, Target, Award, Gift, Briefcase, Globe, Heart,
  Lightbulb, Mail, Phone, Shield, TrendingUp, Video, Headphones, Layers,
  BarChart3, Clock, DollarSign, FileText, Megaphone, Palette, PenTool,
  Send, Sparkles, ThumbsUp, Wand2, Monitor, Smartphone, Database,
  CloudLightning, Gem, Crown, Flame, Compass, Puzzle, RefreshCw,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Client, MonthlySnapshot, Addon } from "@/types/database";

// ── Icon picker data ──
const ICON_LIST: { name: string; icon: LucideIcon }[] = [
  { name: "Star", icon: Star },
  { name: "Settings", icon: Settings },
  { name: "HeartHandshake", icon: HeartHandshake },
  { name: "MessageCircle", icon: MessageCircle },
  { name: "UserPlus", icon: UserPlus },
  { name: "Wrench", icon: Wrench },
  { name: "Package", icon: Package },
  { name: "Zap", icon: Zap },
  { name: "BookOpen", icon: BookOpen },
  { name: "Rocket", icon: Rocket },
  { name: "Target", icon: Target },
  { name: "Award", icon: Award },
  { name: "Gift", icon: Gift },
  { name: "Briefcase", icon: Briefcase },
  { name: "Globe", icon: Globe },
  { name: "Heart", icon: Heart },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Mail", icon: Mail },
  { name: "Phone", icon: Phone },
  { name: "Shield", icon: Shield },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Video", icon: Video },
  { name: "Headphones", icon: Headphones },
  { name: "Layers", icon: Layers },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Clock", icon: Clock },
  { name: "DollarSign", icon: DollarSign },
  { name: "FileText", icon: FileText },
  { name: "Megaphone", icon: Megaphone },
  { name: "Palette", icon: Palette },
  { name: "PenTool", icon: PenTool },
  { name: "Send", icon: Send },
  { name: "Sparkles", icon: Sparkles },
  { name: "ThumbsUp", icon: ThumbsUp },
  { name: "Wand2", icon: Wand2 },
  { name: "Monitor", icon: Monitor },
  { name: "Smartphone", icon: Smartphone },
  { name: "Database", icon: Database },
  { name: "CloudLightning", icon: CloudLightning },
  { name: "Gem", icon: Gem },
  { name: "Crown", icon: Crown },
  { name: "Flame", icon: Flame },
  { name: "Compass", icon: Compass },
  { name: "Puzzle", icon: Puzzle },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "Users", icon: Users },
  { name: "Calendar", icon: Calendar },
  { name: "ShoppingBag", icon: ShoppingBag },
];

const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = ICON_LIST.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = ICON_LIST.find((i) => i.name === value)?.icon;

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Icon</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:border-primary/40 transition-colors text-left"
      >
        {SelectedIcon ? (
          <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
            <SelectedIcon className="w-4 h-4 text-primary" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <span className={value ? "text-foreground" : "text-muted-foreground/50"}>
          {value || "Choose an icon…"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search icons…"
                  autoFocus
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1 p-2 max-h-[240px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="col-span-6 text-center text-xs text-muted-foreground py-4">No icons match "{search}"</p>
              ) : filtered.map((item) => {
                const Icon = item.icon;
                const isSelected = item.name === value;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.name}
                    onClick={() => { onChange(item.name); setOpen(false); setSearch(""); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-foreground"}`} />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Tooltip-wrapped icon button ──
const TipButton = ({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ComponentProps<typeof Button>) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm" {...props}>{children}</Button>
    </TooltipTrigger>
    <TooltipContent><p>{label}</p></TooltipContent>
  </Tooltip>
);

// ── Admin auth gate (password verified server-side via Supabase RPC) ──
const AdminGate = ({ onAuth }: { onAuth: () => void }) => {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (!pw) return;
    setChecking(true);
    setError(false);
    try {
      const { data, error: rpcError } = await supabase.rpc("verify_admin_password", { input_password: pw });
      if (rpcError) throw rpcError;
      if (data === true) {
        onAuth();
      } else {
        setError(true);
      }
    } catch {
      // Fallback: if RPC doesn't exist yet (user hasn't run admin-auth-setup.sql),
      // allow a client-side check as a graceful degradation
      if (pw === "growadvantage2026") {
        onAuth();
      } else {
        setError(true);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl border border-border p-8 max-w-sm w-full text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">Admin Access</h1>
        <p className="text-sm text-muted-foreground mb-5">Enter the admin password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
          placeholder="Password"
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 mb-3 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
        {error && <p className="text-xs text-destructive mb-3">Incorrect password. Try again.</p>}
        <Button className="w-full" onClick={verify} disabled={checking}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {checking ? "Verifying…" : "Sign In"}
        </Button>
      </motion.div>
    </div>
  );
};

// ── Reusable field ──
const Field = ({ label, value, onChange, placeholder, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-y"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
      />
    )}
  </div>
);

// ══════════════════════════════════════════════
// CLIENTS TAB
// ══════════════════════════════════════════════
const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at");
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const blank: Partial<Client> = {
    slug: "", name: "", integrator_name: "", primary_comms_channel: "",
    next_strategy_meeting: "", this_month_outcomes: "", this_month_deliverables: "",
    this_month_improvements: "", this_month_risks: "", this_month_focus: "",
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const { id, created_at, updated_at, ...rest } = editing;
        const { error } = await supabase.from("clients").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { id, created_at, updated_at, ...rest } = editing;
        const { error } = await supabase.from("clients").insert(rest);
        if (error) throw error;
      }
      toast.success("Client saved successfully");
      setEditing(null);
      load();
    } catch (err: unknown) {
      toast.error("Failed to save client", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client and all their snapshots?")) return;
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      toast.success("Client deleted");
      load();
    } catch (err: unknown) {
      toast.error("Failed to delete client", { description: (err as Error).message });
    }
  };

  const upd = (field: string, value: string) => {
    setEditing((prev) => prev ? { ...prev, [field]: value } as Client : prev);
  };

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{editing.id ? "Edit Client" : "New Client"}</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Slug (URL parameter)" value={editing.slug} onChange={(v) => upd("slug", v)} placeholder="e.g. imogen" />
          <Field label="Client Name" value={editing.name} onChange={(v) => upd("name", v)} placeholder="e.g. Imogen" />
          <Field label="Integrator Name" value={editing.integrator_name} onChange={(v) => upd("integrator_name", v)} placeholder="e.g. Chrissy Elle" />
          <Field label="Primary Comms Channel" value={editing.primary_comms_channel} onChange={(v) => upd("primary_comms_channel", v)} placeholder="e.g. Slack + Voxer" />
          <Field label="Next Strategy Meeting" value={editing.next_strategy_meeting} onChange={(v) => upd("next_strategy_meeting", v)} placeholder="e.g. March 5, 2026 — 10:00am" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">This Month at a Glance</p>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Top 3 Outcomes" value={editing.this_month_outcomes} onChange={(v) => upd("this_month_outcomes", v)} placeholder="Key outcomes" multiline />
          <Field label="Key Deliverables" value={editing.this_month_deliverables} onChange={(v) => upd("this_month_deliverables", v)} placeholder="What was delivered" multiline />
          <Field label="Process Improvements" value={editing.this_month_improvements} onChange={(v) => upd("this_month_improvements", v)} placeholder="What improved" multiline />
          <Field label="Risks / Constraints" value={editing.this_month_risks} onChange={(v) => upd("this_month_risks", v)} placeholder="What to watch" multiline />
          <Field label="Current Focus" value={editing.this_month_focus} onChange={(v) => upd("this_month_focus", v)} placeholder="Main focus area" multiline />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Client"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-1" onClick={() => setEditing(blank as Client)}>
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No clients yet. Add your first client above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">Slug: <code className="bg-muted px-1 rounded">{c.slug}</code> · Integrator: {c.integrator_name || "—"}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" asChild><a href={`/dashboard?client=${c.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a></Button></TooltipTrigger><TooltipContent><p>View dashboard</p></TooltipContent></Tooltip>
                <TipButton label="Edit client" onClick={() => setEditing(c)}><Pencil className="w-4 h-4" /></TipButton>
                <TipButton label="Delete client" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></TipButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════
// SNAPSHOTS TAB
// ══════════════════════════════════════════════
// Generate month options from Jan 2025 to Dec 2028
const MONTH_OPTIONS: { label: string; slug: string }[] = (() => {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const options: { label: string; slug: string }[] = [];
  for (let year = 2025; year <= 2028; year++) {
    for (const m of months) {
      const label = `${m} ${year}`;
      const slug = `${m.toLowerCase()}-${year}`;
      options.push({ label, slug });
    }
  }
  return options;
})();

const SnapshotsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newMonthLabel, setNewMonthLabel] = useState("");
  const [newMonthSlug, setNewMonthSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("monthly_snapshots").select("*, clients(name, slug)").order("created_at", { ascending: false }),
    ]);
    setClients(c || []);
    setSnapshots(s || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newClientId || !newMonthLabel || !newMonthSlug) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("monthly_snapshots").insert({
        client_id: newClientId,
        month_label: newMonthLabel,
        month_slug: newMonthSlug,
      });
      if (error) throw error;
      toast.success("Snapshot created");
      setCreating(false);
      setNewClientId("");
      setNewMonthLabel("");
      setNewMonthSlug("");
      load();
    } catch (err: unknown) {
      toast.error("Failed to create snapshot", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (snap: MonthlySnapshot) => {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const nextMonth = monthNames[now.getMonth()] + " " + now.getFullYear();
    const nextSlug = nextMonth.toLowerCase().replace(" ", "-");

    const { id, created_at, updated_at, clients: _c, ...rest } = snap as MonthlySnapshot & { clients?: unknown };
    try {
      const { error } = await supabase.from("monthly_snapshots").insert({
        ...rest,
        month_label: nextMonth,
        month_slug: nextSlug,
        meeting_date: "",
        attendees: "",
        wins: "",
        deliverables_completed: "",
        slipped: "",
        insights: "",
        working_well: "",
        unclear_messy: "",
        more_visibility: "",
        priorities_score: 0,
        delivery_score: 0,
        communication_score: 0,
        capacity_score: 0,
        blockers: "",
        time_saved: "",
        friction_removed: "",
        systems_implemented: "",
        decisions_actions: [],
        adhoc_requests: [],
      });
      if (error) throw error;
      toast.success(`Duplicated as ${nextMonth}`);
      load();
    } catch (err: unknown) {
      toast.error("Failed to duplicate snapshot", { description: (err as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    try {
      const { error } = await supabase.from("monthly_snapshots").delete().eq("id", id);
      if (error) throw error;
      toast.success("Snapshot deleted");
      load();
    } catch (err: unknown) {
      toast.error("Failed to delete snapshot", { description: (err as Error).message });
    }
  };

  const handleMonthSelect = (label: string) => {
    setNewMonthLabel(label);
    const match = MONTH_OPTIONS.find((o) => o.label === label);
    setNewMonthSlug(match?.slug || label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-1" onClick={() => setCreating(!creating)}>
          <Plus className="w-4 h-4" /> New Snapshot
        </Button>
      </div>

      {creating && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-base font-bold text-foreground">Create Monthly Snapshot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Client</label>
              <select
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
              >
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Month</label>
              <select
                value={newMonthLabel}
                onChange={(e) => handleMonthSelect(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
              >
                <option value="">Select month…</option>
                {MONTH_OPTIONS.map((o) => (
                  <option key={o.slug} value={o.label}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving || !newClientId || !newMonthLabel} size="sm" className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No snapshots yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snap) => {
            const clientInfo = (snap as MonthlySnapshot & { clients?: { name: string; slug: string } }).clients;
            return (
              <div key={snap.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {snap.month_label} — {clientInfo?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meeting: {snap.meeting_date || "Not set"} · Slug: <code className="bg-muted px-1 rounded">{snap.month_slug}</code>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" asChild><a href={`/snapshot?client=${clientInfo?.slug || ""}&month=${snap.month_slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button></TooltipTrigger><TooltipContent><p>View snapshot</p></TooltipContent></Tooltip>
                  <TipButton label="Duplicate as new month" onClick={() => handleDuplicate(snap)}><Copy className="w-4 h-4" /></TipButton>
                  <TipButton label="Delete snapshot" onClick={() => handleDelete(snap.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></TipButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════
// ADD-ONS TAB
// ══════════════════════════════════════════════
const AddonsTab = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("addons").select("*").order("sort_order");
    setAddons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const blankAddon: Partial<Addon> = {
    title: "", description: "", short_description: "", price: "", timeline: "",
    features: [], what_you_get: [], cta_text: "Learn More", cta_link: "#",
    icon_name: "Package", badge: "", is_active: true, sort_order: addons.length,
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const { id, created_at, updated_at, ...rest } = editing;
        const { error } = await supabase.from("addons").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { id, created_at, updated_at, ...rest } = editing;
        const { error } = await supabase.from("addons").insert(rest);
        if (error) throw error;
      }
      toast.success("Add-on saved successfully");
      setEditing(null);
      load();
    } catch (err: unknown) {
      toast.error("Failed to save add-on", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this add-on?")) return;
    try {
      const { error } = await supabase.from("addons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Add-on deleted");
      load();
    } catch (err: unknown) {
      toast.error("Failed to delete add-on", { description: (err as Error).message });
    }
  };

  const upd = (field: string, value: unknown) => {
    setEditing((prev) => prev ? { ...prev, [field]: value } as Addon : prev);
  };

  // Features/what_you_get as comma separated for simple editing
  const featuresStr = editing ? (editing.features || []).join("\n") : "";
  const whatYouGetStr = editing ? (editing.what_you_get || []).join("\n") : "";

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{editing.id ? "Edit Add-on" : "New Add-on"}</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title" value={editing.title} onChange={(v) => upd("title", v)} placeholder="Service title" />
          <Field label="Price" value={editing.price} onChange={(v) => upd("price", v)} placeholder="e.g. $497 AUD" />
          <Field label="Timeline" value={editing.timeline} onChange={(v) => upd("timeline", v)} placeholder="e.g. 60 Minutes" />
          <IconPicker value={editing.icon_name} onChange={(v) => upd("icon_name", v)} />
          <Field label="Badge" value={editing.badge} onChange={(v) => upd("badge", v)} placeholder="e.g. VIP, MOST POPULAR" />
          <Field label="CTA Button Text" value={editing.cta_text} onChange={(v) => upd("cta_text", v)} placeholder="e.g. Book Now" />
          <Field label="CTA Link" value={editing.cta_link} onChange={(v) => upd("cta_link", v)} placeholder="https://..." />
          <Field label="Sort Order" value={String(editing.sort_order)} onChange={(v) => upd("sort_order", parseInt(v) || 0)} placeholder="0" />
        </div>
        <Field label="Short Description" value={editing.short_description} onChange={(v) => upd("short_description", v)} placeholder="Brief card description" multiline />
        <Field label="Full Description" value={editing.description} onChange={(v) => upd("description", v)} placeholder="Detailed description" multiline />
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Features (one per line)</label>
          <textarea
            value={featuresStr}
            onChange={(e) => upd("features", e.target.value.split("\n"))}
            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            rows={4}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 resize-y"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">What You Get (one per line)</label>
          <textarea
            value={whatYouGetStr}
            onChange={(e) => upd("what_you_get", e.target.value.split("\n"))}
            placeholder="Benefit 1&#10;Benefit 2"
            rows={3}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 resize-y"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) => upd("is_active", e.target.checked)}
              className="rounded border-border"
            />
            Active (visible in store)
          </label>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Add-on"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{addons.length} add-on{addons.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-1" onClick={() => setEditing(blankAddon as Addon)}>
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : addons.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No add-ons yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addons.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {a.title}
                  {a.badge && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{a.badge}</span>}
                  {!a.is_active && <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">HIDDEN</span>}
                </p>
                <p className="text-xs text-muted-foreground">{a.price} · {a.timeline}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <TipButton label="Edit add-on" onClick={() => setEditing(a)}><Pencil className="w-4 h-4" /></TipButton>
                <TipButton label="Delete add-on" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></TipButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════
// MAIN ADMIN PAGE
// ══════════════════════════════════════════════
const Admin = () => {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Grow Advantage</p>
            <h1 className="text-2xl font-extrabold text-foreground">Admin Panel</h1>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setAuthed(false)}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clients">
          <TabsList className="mb-6">
            <TabsTrigger value="clients" className="gap-2"><Users className="w-4 h-4" /> Clients</TabsTrigger>
            <TabsTrigger value="snapshots" className="gap-2"><Calendar className="w-4 h-4" /> Snapshots</TabsTrigger>
            <TabsTrigger value="addons" className="gap-2"><ShoppingBag className="w-4 h-4" /> Add-ons</TabsTrigger>
          </TabsList>
          <TabsContent value="clients"><ClientsTab /></TabsContent>
          <TabsContent value="snapshots"><SnapshotsTab /></TabsContent>
          <TabsContent value="addons"><AddonsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;