import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, Loader2, Calendar, Target, FileCheck,
  TrendingUp, Lightbulb, AlertTriangle, MessageSquare, ThumbsUp,
  ClipboardList, Zap, Plus, Trash2, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  Client, MonthlySnapshot, AgreementItem, PriorityItem,
  ProcessItem, AdhocItem, MeetingItem, DecisionItem
} from "@/types/database";

// ──────────────────────────────────────────────
// Display components (read-only)
// ──────────────────────────────────────────────

const ReadOnlyText = ({ value, placeholder }: { value: string; placeholder?: string }) => (
  <p className="text-sm text-foreground px-3 py-2 min-h-[36px]">
    {value || <span className="text-muted-foreground/40 italic">{placeholder || "—"}</span>}
  </p>
);

const ReadOnlyMultiline = ({ value, placeholder }: { value: string; placeholder?: string }) => (
  <p className="text-sm text-foreground px-3 py-2 whitespace-pre-wrap leading-relaxed min-h-[36px]">
    {value || <span className="text-muted-foreground/40 italic">{placeholder || "—"}</span>}
  </p>
);

const ScoreDisplay = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-foreground">{label}</span>
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <div
          key={n}
          className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center ${
            n <= value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {n}
        </div>
      ))}
      <span className="ml-2 text-sm font-bold text-foreground">{value}/10</span>
    </div>
  </div>
);

// ──────────────────────────────────────────────
// Editable components (edit mode)
// ──────────────────────────────────────────────

const EditableText = ({
  value, onChange, placeholder, multiline = false, className = ""
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; className?: string;
}) => multiline ? (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={3}
    className={`w-full bg-transparent border border-transparent hover:border-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y transition-colors outline-none ${className}`}
  />
) : (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full bg-transparent border border-transparent hover:border-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors outline-none ${className}`}
  />
);

const ScoreInput = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-foreground">{label}</span>
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
            n <= value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

// ──────────────────────────────────────────────
// Section wrapper
// ──────────────────────────────────────────────

const Section = ({
  icon: Icon, title, delay = 0, sectionId, children
}: {
  icon: React.ElementType; title: string; delay?: number; sectionId?: string; children: React.ReactNode;
}) => (
  <motion.section
    id={sectionId}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card rounded-xl border border-border overflow-hidden scroll-mt-28"
  >
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
      <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </motion.section>
);

// Section navigation data
const SECTION_NAV = [
  { id: "sec-meeting", label: "Meeting", short: "1" },
  { id: "sec-purpose", label: "Purpose", short: "2" },
  { id: "sec-agreement", label: "Agreement", short: "3" },
  { id: "sec-review", label: "Review", short: "4" },
  { id: "sec-upcoming", label: "Upcoming", short: "5" },
  { id: "sec-process", label: "Process", short: "6" },
  { id: "sec-adhoc", label: "Ad hoc", short: "7" },
  { id: "sec-comms", label: "Comms", short: "8" },
  { id: "sec-feedback", label: "Feedback", short: "9" },
  { id: "sec-decisions", label: "Decisions", short: "10" },
  { id: "sec-impact", label: "Impact", short: "11" },
];

const SectionNav = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-40 md:hidden">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 bg-card border border-border rounded-xl shadow-lg p-2 max-h-[60vh] overflow-y-auto"
          >
            {SECTION_NAV.map((s) => (
              <button
                key={s.id}
                onClick={() => { document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); setExpanded(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
              >
                <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{s.short}</span>
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <ClipboardList className="w-5 h-5" />
      </button>
    </div>
  );
};

// ──────────────────────────────────────────────
// Read-only table (no inputs, no actions)
// ──────────────────────────────────────────────

const ReadOnlyTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          {headers.map((h, i) => (
            <th key={i} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} className="py-4 px-3 text-center text-sm text-muted-foreground/50 italic">No entries yet</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} className="border-b border-border/50 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="py-2.5 px-3 text-sm text-foreground">{cell || <span className="text-muted-foreground/40">—</span>}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

const Snapshot = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";
  const monthSlug = searchParams.get("month") || "";
  const isEditMode = searchParams.get("edit") === "true";

  const [client, setClient] = useState<Client | null>(null);
  const [snapshot, setSnapshot] = useState<MonthlySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty || !isEditMode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, isEditMode]);

  useEffect(() => {
    if (!clientSlug || !monthSlug) return;
    const load = async () => {
      setLoading(true);
      const { data: c } = await supabase.from("clients").select("*").eq("slug", clientSlug).single();
      if (c) {
        setClient(c);
        const { data: s } = await supabase
          .from("monthly_snapshots")
          .select("*")
          .eq("client_id", c.id)
          .eq("month_slug", monthSlug)
          .single();
        if (s) setSnapshot(s);
      }
      setLoading(false);
    };
    load();
  }, [clientSlug, monthSlug]);

  const update = useCallback((field: string, value: unknown) => {
    setSnapshot((prev) => prev ? { ...prev, [field]: value } as MonthlySnapshot : prev);
    setSaved(false);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!snapshot) return;
    setSaving(true);
    try {
      const { id, created_at, ...rest } = snapshot;
      const { error } = await supabase.from("monthly_snapshots").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setSaved(true);
      setDirty(false);
      toast.success("Snapshot saved");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      toast.error("Failed to save snapshot", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const updateArrayItem = <T,>(field: string, arr: T[], index: number, key: keyof T, value: string) => {
    const copy = [...arr];
    copy[index] = { ...copy[index], [key]: value };
    update(field, copy);
  };
  const addArrayItem = <T,>(field: string, arr: T[], template: T) => {
    update(field, [...arr, template]);
  };
  const removeArrayItem = <T,>(field: string, arr: T[], index: number) => {
    update(field, arr.filter((_, i) => i !== index));
  };

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!client || !snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Snapshot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            No snapshot found for client <strong>"{clientSlug}"</strong>, month <strong>"{monthSlug}"</strong>.
          </p>
          <Button asChild variant="outline">
            <Link to={`/dashboard?client=${clientSlug}`}>Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const agreements = (snapshot.agreement_snapshot || []) as AgreementItem[];
  const priorities = (snapshot.upcoming_priorities || []) as PriorityItem[];
  const processImps = (snapshot.process_improvements || []) as ProcessItem[];
  const adhocs = (snapshot.adhoc_requests || []) as AdhocItem[];
  const meetings = (snapshot.recurring_meetings || []) as MeetingItem[];
  const decisions = (snapshot.decisions_actions || []) as DecisionItem[];

  return (
    <div className="min-h-screen bg-background">
      <SectionNav />
      {/* Edit mode banner + save */}
      {isEditMode && (
        <div className="sticky top-12 z-30 bg-primary/5 border-b border-primary/10">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-medium text-primary">Edit mode — all fields are editable. Click Save when done.</p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Monthly Snapshot</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            {snapshot.month_label} — {client.name}
          </h1>
        </motion.div>
      </div>

      {/* Sections */}
      <div className="container mx-auto px-4 pb-12 space-y-6">

        {/* 1. Meeting Details */}
        <Section icon={Calendar} title="Meeting Details" delay={0.05} sectionId="sec-meeting">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Client</label>
              <p className="text-sm font-medium text-foreground px-3 py-2">{client.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Meeting Date</label>
              {isEditMode
                ? <EditableText value={snapshot.meeting_date} onChange={(v) => update("meeting_date", v)} placeholder="e.g. February 6, 2026" />
                : <ReadOnlyText value={snapshot.meeting_date} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Attendees</label>
              {isEditMode
                ? <EditableText value={snapshot.attendees} onChange={(v) => update("attendees", v)} placeholder="e.g. Imogen, Chrissy, VA Team" />
                : <ReadOnlyText value={snapshot.attendees} />}
            </div>
          </div>
        </Section>

        {/* 2. Purpose of Meeting */}
        <Section icon={Target} title="Purpose of Meeting" delay={0.08} sectionId="sec-purpose">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Align on priorities + outcomes for the next month</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Review delivery + capacity fit (integrator + offshore ops)</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Confirm upcoming deliverables, process improvements, and comms cadence</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>Capture decisions + actions clearly</li>
          </ul>
        </Section>

        {/* 3. Agreement Snapshot */}
        <Section icon={FileCheck} title="Agreement Snapshot — Operations Partnership" delay={0.11} sectionId="sec-agreement">
          {isEditMode ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[30%]">Item</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[30%]">Standard Inclusion</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes / Exceptions</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1 px-1"><EditableText value={row.item} onChange={(v) => updateArrayItem("agreement_snapshot", agreements, i, "item", v)} placeholder="Item" /></td>
                        <td className="py-1 px-1"><EditableText value={row.inclusion} onChange={(v) => updateArrayItem("agreement_snapshot", agreements, i, "inclusion", v)} placeholder="Inclusion" /></td>
                        <td className="py-1 px-1"><EditableText value={row.notes} onChange={(v) => updateArrayItem("agreement_snapshot", agreements, i, "notes", v)} placeholder="Notes" /></td>
                        <td className="py-1 px-1"><button onClick={() => removeArrayItem("agreement_snapshot", agreements, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("agreement_snapshot", agreements, { item: "", inclusion: "", notes: "" })}>
                <Plus className="w-3.5 h-3.5" /> Add Row
              </Button>
            </>
          ) : (
            <ReadOnlyTable
              headers={["Item", "Standard Inclusion", "Notes / Exceptions"]}
              rows={agreements.map((r) => [r.item, r.inclusion, r.notes])}
            />
          )}
        </Section>

        {/* 4. Previous Month Review */}
        <Section icon={TrendingUp} title="Work to Date — Previous Month Review" delay={0.14} sectionId="sec-review">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Wins / Progress</label>
              {isEditMode ? <EditableText multiline value={snapshot.wins} onChange={(v) => update("wins", v)} placeholder="What went well this month…" /> : <ReadOnlyMultiline value={snapshot.wins} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Key Deliverables Completed</label>
              {isEditMode ? <EditableText multiline value={snapshot.deliverables_completed} onChange={(v) => update("deliverables_completed", v)} placeholder="What was delivered…" /> : <ReadOnlyMultiline value={snapshot.deliverables_completed} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">What Didn't Land / Slipped (and why)</label>
              {isEditMode ? <EditableText multiline value={snapshot.slipped} onChange={(v) => update("slipped", v)} placeholder="What slipped and why…" /> : <ReadOnlyMultiline value={snapshot.slipped} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Insights / Lessons Learned</label>
              {isEditMode ? <EditableText multiline value={snapshot.insights} onChange={(v) => update("insights", v)} placeholder="Key takeaways…" /> : <ReadOnlyMultiline value={snapshot.insights} />}
            </div>
          </div>
        </Section>

        {/* 5. Upcoming Month */}
        <Section icon={Target} title="Upcoming Month — Priorities & Outcomes" delay={0.17} sectionId="sec-upcoming">
          {isEditMode ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[35%]">Outcome (define "done")</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[15%]">Owner</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[15%]">Due / Cadence</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorities.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1 px-1"><EditableText value={row.outcome} onChange={(v) => updateArrayItem("upcoming_priorities", priorities, i, "outcome", v)} placeholder="Outcome" /></td>
                        <td className="py-1 px-1"><EditableText value={row.owner} onChange={(v) => updateArrayItem("upcoming_priorities", priorities, i, "owner", v)} placeholder="Owner" /></td>
                        <td className="py-1 px-1"><EditableText value={row.due} onChange={(v) => updateArrayItem("upcoming_priorities", priorities, i, "due", v)} placeholder="Due" /></td>
                        <td className="py-1 px-1"><EditableText value={row.notes} onChange={(v) => updateArrayItem("upcoming_priorities", priorities, i, "notes", v)} placeholder="Notes" /></td>
                        <td className="py-1 px-1"><button onClick={() => removeArrayItem("upcoming_priorities", priorities, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("upcoming_priorities", priorities, { outcome: "", owner: "", due: "", notes: "" })}>
                <Plus className="w-3.5 h-3.5" /> Add Row
              </Button>
            </>
          ) : (
            <ReadOnlyTable
              headers={["Outcome", "Owner", "Due / Cadence", "Notes"]}
              rows={priorities.map((r) => [r.outcome, r.owner, r.due, r.notes])}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Key Deadlines / Launches / Campaigns</label>
              {isEditMode ? <EditableText multiline value={snapshot.key_deadlines} onChange={(v) => update("key_deadlines", v)} placeholder="Important dates…" /> : <ReadOnlyMultiline value={snapshot.key_deadlines} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Risks / Constraints</label>
              {isEditMode ? <EditableText multiline value={snapshot.risks_constraints} onChange={(v) => update("risks_constraints", v)} placeholder="What could block progress…" /> : <ReadOnlyMultiline value={snapshot.risks_constraints} />}
            </div>
          </div>
        </Section>

        {/* 6. Process Improvements */}
        <Section icon={Lightbulb} title="Process Improvement Projects" delay={0.2} sectionId="sec-process">
          {isEditMode ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Status</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Priority</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Owner</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Step</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {processImps.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1 px-1"><EditableText value={row.project} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "project", v)} placeholder="Project" /></td>
                        <td className="py-1 px-1"><EditableText value={row.status} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "status", v)} placeholder="Status" /></td>
                        <td className="py-1 px-1"><EditableText value={row.priority} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "priority", v)} placeholder="Must/Nice/Parked" /></td>
                        <td className="py-1 px-1"><EditableText value={row.owner} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "owner", v)} placeholder="Owner" /></td>
                        <td className="py-1 px-1"><EditableText value={row.next_step} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "next_step", v)} placeholder="Next step" /></td>
                        <td className="py-1 px-1"><EditableText value={row.notes} onChange={(v) => updateArrayItem("process_improvements", processImps, i, "notes", v)} placeholder="Notes" /></td>
                        <td className="py-1 px-1"><button onClick={() => removeArrayItem("process_improvements", processImps, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("process_improvements", processImps, { project: "", status: "", priority: "", owner: "", next_step: "", notes: "" })}>
                <Plus className="w-3.5 h-3.5" /> Add Row
              </Button>
            </>
          ) : (
            <ReadOnlyTable
              headers={["Project", "Status", "Priority", "Owner", "Next Step", "Notes"]}
              rows={processImps.map((r) => [r.project, r.status, r.priority, r.owner, r.next_step, r.notes])}
            />
          )}
        </Section>

        {/* 7. Ad hoc Requests */}
        <Section icon={ClipboardList} title="Ad hoc / Other Requests" delay={0.23} sectionId="sec-adhoc">
          {isEditMode ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[35%]">Request</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[15%]">Owner</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[15%]">Due</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adhocs.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1 px-1"><EditableText value={row.request} onChange={(v) => updateArrayItem("adhoc_requests", adhocs, i, "request", v)} placeholder="Request" /></td>
                        <td className="py-1 px-1"><EditableText value={row.owner} onChange={(v) => updateArrayItem("adhoc_requests", adhocs, i, "owner", v)} placeholder="Owner" /></td>
                        <td className="py-1 px-1"><EditableText value={row.due} onChange={(v) => updateArrayItem("adhoc_requests", adhocs, i, "due", v)} placeholder="Due" /></td>
                        <td className="py-1 px-1"><EditableText value={row.notes} onChange={(v) => updateArrayItem("adhoc_requests", adhocs, i, "notes", v)} placeholder="Notes" /></td>
                        <td className="py-1 px-1"><button onClick={() => removeArrayItem("adhoc_requests", adhocs, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("adhoc_requests", adhocs, { request: "", owner: "", due: "", notes: "" })}>
                <Plus className="w-3.5 h-3.5" /> Add Row
              </Button>
            </>
          ) : (
            <ReadOnlyTable
              headers={["Request", "Owner", "Due", "Notes"]}
              rows={adhocs.map((r) => [r.request, r.owner, r.due, r.notes])}
            />
          )}
        </Section>

        {/* 8. Communication */}
        <Section icon={MessageSquare} title="Communication Tools + Cadence" delay={0.26} sectionId="sec-comms">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Primary Communication Channels</label>
              {isEditMode ? <EditableText multiline value={snapshot.primary_comms} onChange={(v) => update("primary_comms", v)} placeholder="e.g. Slack (async daily), Voxer (urgent), Zoom (monthly)" /> : <ReadOnlyMultiline value={snapshot.primary_comms} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Recurring Meetings</label>
              {isEditMode ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[25%]">Meeting</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">Cadence</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">Time</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-1 px-1"><EditableText value={row.meeting} onChange={(v) => updateArrayItem("recurring_meetings", meetings, i, "meeting", v)} placeholder="Meeting" /></td>
                            <td className="py-1 px-1"><EditableText value={row.cadence} onChange={(v) => updateArrayItem("recurring_meetings", meetings, i, "cadence", v)} placeholder="Weekly/Monthly" /></td>
                            <td className="py-1 px-1"><EditableText value={row.time} onChange={(v) => updateArrayItem("recurring_meetings", meetings, i, "time", v)} placeholder="Time" /></td>
                            <td className="py-1 px-1"><EditableText value={row.notes} onChange={(v) => updateArrayItem("recurring_meetings", meetings, i, "notes", v)} placeholder="Notes" /></td>
                            <td className="py-1 px-1"><button onClick={() => removeArrayItem("recurring_meetings", meetings, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("recurring_meetings", meetings, { meeting: "", cadence: "", time: "", notes: "" })}>
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </>
              ) : (
                <ReadOnlyTable
                  headers={["Meeting", "Cadence", "Time", "Notes"]}
                  rows={meetings.map((r) => [r.meeting, r.cadence, r.time, r.notes])}
                />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Response Times + Escalation</label>
              {isEditMode ? <EditableText multiline value={snapshot.response_times} onChange={(v) => update("response_times", v)} placeholder="e.g. Slack: same-day, Voxer: 2hrs, Email: 24hrs" /> : <ReadOnlyMultiline value={snapshot.response_times} />}
            </div>
          </div>
        </Section>

        {/* 9. Client Feedback */}
        <Section icon={ThumbsUp} title="Client Feedback & Confidence Check" delay={0.29} sectionId="sec-feedback">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">What's Working Well</label>
              {isEditMode ? <EditableText multiline value={snapshot.working_well} onChange={(v) => update("working_well", v)} placeholder="What feels good…" /> : <ReadOnlyMultiline value={snapshot.working_well} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">What Feels Unclear / Messy / Heavy</label>
              {isEditMode ? <EditableText multiline value={snapshot.unclear_messy} onChange={(v) => update("unclear_messy", v)} placeholder="What needs attention…" /> : <ReadOnlyMultiline value={snapshot.unclear_messy} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Where They Want More Visibility / Support</label>
              {isEditMode ? <EditableText multiline value={snapshot.more_visibility} onChange={(v) => update("more_visibility", v)} placeholder="Where to improve…" /> : <ReadOnlyMultiline value={snapshot.more_visibility} />}
            </div>
            <div className="pt-2 border-t border-border space-y-1">
              {isEditMode ? (
                <>
                  <ScoreInput label="Priorities clarity" value={snapshot.priorities_score} onChange={(v) => update("priorities_score", v)} />
                  <ScoreInput label="Delivery confidence" value={snapshot.delivery_score} onChange={(v) => update("delivery_score", v)} />
                  <ScoreInput label="Communication flow" value={snapshot.communication_score} onChange={(v) => update("communication_score", v)} />
                  <ScoreInput label="Capacity fit" value={snapshot.capacity_score} onChange={(v) => update("capacity_score", v)} />
                </>
              ) : (
                <>
                  <ScoreDisplay label="Priorities clarity" value={snapshot.priorities_score} />
                  <ScoreDisplay label="Delivery confidence" value={snapshot.delivery_score} />
                  <ScoreDisplay label="Communication flow" value={snapshot.communication_score} />
                  <ScoreDisplay label="Capacity fit" value={snapshot.capacity_score} />
                </>
              )}
            </div>
          </div>
        </Section>

        {/* 10. Decisions & Actions */}
        <Section icon={ClipboardList} title="Decisions, Actions & Owners" delay={0.32} sectionId="sec-decisions">
          {isEditMode ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Type</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Owner</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[15%]">Due / Effective</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[12%]">Status</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1 px-1"><EditableText value={row.type} onChange={(v) => updateArrayItem("decisions_actions", decisions, i, "type", v)} placeholder="Decision/Action" /></td>
                        <td className="py-1 px-1"><EditableText value={row.item} onChange={(v) => updateArrayItem("decisions_actions", decisions, i, "item", v)} placeholder="Description" /></td>
                        <td className="py-1 px-1"><EditableText value={row.owner} onChange={(v) => updateArrayItem("decisions_actions", decisions, i, "owner", v)} placeholder="Owner" /></td>
                        <td className="py-1 px-1"><EditableText value={row.due} onChange={(v) => updateArrayItem("decisions_actions", decisions, i, "due", v)} placeholder="Date" /></td>
                        <td className="py-1 px-1"><EditableText value={row.status} onChange={(v) => updateArrayItem("decisions_actions", decisions, i, "status", v)} placeholder="Status" /></td>
                        <td className="py-1 px-1"><button onClick={() => removeArrayItem("decisions_actions", decisions, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => addArrayItem("decisions_actions", decisions, { type: "", item: "", owner: "", due: "", status: "" })}>
                <Plus className="w-3.5 h-3.5" /> Add Row
              </Button>
            </>
          ) : (
            <ReadOnlyTable
              headers={["Type", "Item", "Owner", "Due / Effective", "Status"]}
              rows={decisions.map((r) => [r.type, r.item, r.owner, r.due, r.status])}
            />
          )}
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Blockers</label>
            {isEditMode ? <EditableText multiline value={snapshot.blockers} onChange={(v) => update("blockers", v)} placeholder="Any blockers to flag…" /> : <ReadOnlyMultiline value={snapshot.blockers} />}
          </div>
        </Section>

        {/* Efficiency / Impact Notes */}
        <Section icon={Zap} title="Efficiency / Impact Notes" delay={0.35} sectionId="sec-impact">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Estimated Time Saved This Month</label>
              {isEditMode ? <EditableText value={snapshot.time_saved} onChange={(v) => update("time_saved", v)} placeholder="e.g. ~6 hours" /> : <ReadOnlyText value={snapshot.time_saved} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Biggest Friction Removed</label>
              {isEditMode ? <EditableText value={snapshot.friction_removed} onChange={(v) => update("friction_removed", v)} placeholder="What was the biggest win…" /> : <ReadOnlyText value={snapshot.friction_removed} />}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Systems Implemented</label>
              {isEditMode ? <EditableText value={snapshot.systems_implemented} onChange={(v) => update("systems_implemented", v)} placeholder="What new systems went live…" /> : <ReadOnlyText value={snapshot.systems_implemented} />}
            </div>
          </div>
        </Section>

        {/* Bottom save bar (edit mode only) */}
        {isEditMode && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save All Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Snapshot;