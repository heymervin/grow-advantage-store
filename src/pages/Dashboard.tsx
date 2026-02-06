import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, FolderOpen, ShoppingBag, Calendar, ChevronRight,
  Clock, Users, MessageSquare, Target, Truck, Lightbulb, AlertTriangle, Compass,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Client, MonthlySnapshot } from "@/types/database";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";
  const [client, setClient] = useState<Client | null>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientSlug) return;
    const load = async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("clients")
        .select("*")
        .eq("slug", clientSlug)
        .single();
      if (c) {
        setClient(c);
        const { data: s } = await supabase
          .from("monthly_snapshots")
          .select("*")
          .eq("client_id", c.id)
          .order("created_at", { ascending: false });
        setSnapshots(s || []);
      }
      setLoading(false);
    };
    load();
  }, [clientSlug]);

  if (!clientSlug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">No Client Selected</h1>
          <p className="text-muted-foreground">Add <code className="bg-muted px-2 py-0.5 rounded text-sm">?client=name</code> to the URL to load a client dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Client Not Found</h1>
          <p className="text-muted-foreground">No client found for <strong>"{clientSlug}"</strong>. Please check the URL.</p>
        </div>
      </div>
    );
  }

  const latestSnapshot = snapshots[0] || null;

  const glanceItems = [
    { label: "Top 3 Outcomes", value: client.this_month_outcomes, icon: Target, color: "text-emerald-600" },
    { label: "Key Deliverables", value: client.this_month_deliverables, icon: Truck, color: "text-blue-600" },
    { label: "Process Improvements", value: client.this_month_improvements, icon: Lightbulb, color: "text-amber-600" },
    { label: "Risks / Constraints", value: client.this_month_risks, icon: AlertTriangle, color: "text-red-500" },
    { label: "Current Focus", value: client.this_month_focus, icon: Compass, color: "text-primary" },
  ];

  const quickLinks = [
    { label: "Agreements", icon: FileText, href: "#agreements", external: false },
    { label: "Files", icon: FolderOpen, href: "#files", external: false },
    { label: "Add-ons & Upgrades", icon: ShoppingBag, href: `/addons?client=${clientSlug}`, external: false },
    ...(latestSnapshot
      ? [{ label: "Latest Snapshot", icon: Calendar, href: `/snapshot?client=${clientSlug}&month=${latestSnapshot.month_slug}`, external: false }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Client Portal</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Welcome back, {client.name}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {client.integrator_name && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Integrator: <strong className="text-foreground">{client.integrator_name}</strong>
                </span>
              )}
              {client.primary_comms_channel && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Comms: <strong className="text-foreground">{client.primary_comms_channel}</strong>
                </span>
              )}
              {client.next_strategy_meeting && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Next meeting: <strong className="text-foreground">{client.next_strategy_meeting}</strong>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Quick Links */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className="group flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </motion.section>

        {/* This Month at a Glance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-4">This Month at a Glance</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {glanceItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 ${i < glanceItems.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-sm text-foreground leading-relaxed">{item.value || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Snapshot History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Monthly Snapshots</h2>
          {snapshots.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No snapshots yet. Your first monthly snapshot will appear here after your strategy meeting.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap, i) => (
                <Link
                  key={snap.id}
                  to={`/snapshot?client=${clientSlug}&month=${snap.month_slug}`}
                  className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Monthly Snapshot — {snap.month_label}
                    </p>
                    {snap.meeting_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Meeting: {snap.meeting_date}
                      </p>
                    )}
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shrink-0">
                      LATEST
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;