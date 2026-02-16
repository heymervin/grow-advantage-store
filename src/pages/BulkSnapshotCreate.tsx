import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, CalendarRange, Plus, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Client } from "@/types/database";

const BulkSnapshotCreate = () => {
  const navigate = useNavigate();
  const [startMonth, setStartMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [loadingClients, setLoadingClients] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load all clients
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("clients").select("*").order("name");
      if (data) {
        setClients(data);
        // Select all by default
        setSelectedClientIds(new Set(data.map(c => c.id)));
      }
      setLoadingClients(false);
    };
    load();
  }, []);

  const getMonthsBetween = (start: string, end: string): Array<{ year: number; month: number }> => {
    const [startYear, startMo] = start.split('-').map(Number);
    const [endYear, endMo] = end.split('-').map(Number);

    const startDate = new Date(startYear, startMo - 1);
    const endDate = new Date(endYear, endMo - 1);

    const months: Array<{ year: number; month: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  const toggleClient = (clientId: string) => {
    const newSet = new Set(selectedClientIds);
    if (newSet.has(clientId)) {
      newSet.delete(clientId);
    } else {
      newSet.add(clientId);
    }
    setSelectedClientIds(newSet);
  };

  const toggleAll = () => {
    if (selectedClientIds.size === clients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleBulkCreate = async () => {
    if (creating || selectedClientIds.size === 0) return;
    setCreating(true);

    try {
      const months = getMonthsBetween(startMonth, endMonth);

      if (months.length === 0) {
        toast.error("Invalid date range");
        setCreating(false);
        return;
      }

      if (months.length > 24) {
        toast.error("Maximum 24 months allowed");
        setCreating(false);
        return;
      }

      const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
      let totalCreated = 0;
      let totalSkipped = 0;

      // Process each client
      for (const client of selectedClients) {
        // Check for existing snapshots
        const monthSlugs = months.map(m => `${monthShort[m.month]}-${m.year}`);
        const { data: existing } = await supabase
          .from("monthly_snapshots")
          .select("month_slug")
          .eq("client_id", client.id)
          .in("month_slug", monthSlugs);

        const existingSlugs = new Set((existing || []).map(e => e.month_slug));
        const newMonths = months.filter(m => !existingSlugs.has(`${monthShort[m.month]}-${m.year}`));

        if (newMonths.length > 0) {
          // Create snapshots for this client
          const snapshots = newMonths.map(m => ({
            client_id: client.id,
            month_label: `${monthNames[m.month]} ${m.year}`,
            month_slug: `${monthShort[m.month]}-${m.year}`,
            meeting_date: "",
            attendees: "",
            agreement_snapshot: [],
            wins: "",
            deliverables_completed: "",
            slipped: "",
            insights: "",
            upcoming_priorities: [],
            key_deadlines: "",
            risks_constraints: "",
            process_improvements: [],
            adhoc_requests: [],
            primary_comms: "",
            recurring_meetings: [],
            response_times: "",
            working_well: "",
            unclear_messy: "",
            more_visibility: "",
            priorities_score: 0,
            delivery_score: 0,
            communication_score: 0,
            capacity_score: 0,
            decisions_actions: [],
            blockers: "",
            time_saved: "",
            friction_removed: "",
            systems_implemented: "",
          }));

          const { error } = await supabase.from("monthly_snapshots").insert(snapshots);
          if (error) throw error;

          totalCreated += newMonths.length;
          totalSkipped += months.length - newMonths.length;
        } else {
          totalSkipped += months.length;
        }
      }

      if (totalCreated > 0) {
        toast.success(
          `Created ${totalCreated} snapshot${totalCreated !== 1 ? 's' : ''} across ${selectedClients.length} client${selectedClients.length !== 1 ? 's' : ''}` +
          (totalSkipped > 0 ? ` (${totalSkipped} already existed)` : '')
        );
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.info("All selected snapshots already exist");
      }
    } catch (err: unknown) {
      toast.error("Failed to create snapshots", { description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  };

  const previewMonths = getMonthsBetween(startMonth, endMonth);
  const totalSnapshots = previewMonths.length * selectedClientIds.size;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-8 pb-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <CalendarRange className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Bulk Create Snapshots
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create monthly snapshots for multiple clients at once
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Date Range */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date Range
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Start Month
                </label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full bg-background border border-border hover:border-primary/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground transition-colors outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  End Month
                </label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full bg-background border border-border hover:border-primary/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground transition-colors outline-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Client Selection */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-primary" />
                Select Clients ({selectedClientIds.size} of {clients.length})
              </h2>
              <button
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {selectedClientIds.size === clients.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="bg-muted/30 rounded-lg border border-border max-h-96 overflow-y-auto">
              {loadingClients ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : clients.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No clients found. Please add clients first.
                </div>
              ) : (
                clients.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.has(client.id)}
                      onChange={() => toggleClient(client.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm text-foreground flex-1 font-medium">{client.name}</span>
                  </label>
                ))
              )}
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <h2 className="text-base font-bold text-foreground mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Months selected:</span>
                <span className="font-semibold text-foreground">{previewMonths.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Clients selected:</span>
                <span className="font-semibold text-foreground">{selectedClientIds.size}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-primary/5 -mx-6 px-6 rounded-b-xl">
                <span className="text-sm font-bold text-foreground">Total snapshots to create:</span>
                <span className="text-xl font-bold text-primary">{totalSnapshots}</span>
              </div>
            </div>

            {previewMonths.length > 24 && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive font-medium">⚠️ Maximum 24 months allowed</p>
              </div>
            )}
            {selectedClientIds.size === 0 && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive font-medium">⚠️ Please select at least one client</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Existing snapshots will be skipped automatically. This operation may take a few moments for large batches.
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex items-center justify-end gap-3"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={creating || previewMonths.length === 0 || previewMonths.length > 24 || selectedClientIds.size === 0}
              className="gap-2"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating {totalSnapshots} snapshots...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create {totalSnapshots} Snapshot{totalSnapshots !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BulkSnapshotCreate;
