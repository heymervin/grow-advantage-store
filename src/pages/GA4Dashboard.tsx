import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Monitor, Smartphone, Tablet, TrendingUp, Users, Eye, FileText, MapPin, Activity, AlertTriangle, Calendar } from "lucide-react";

// Types
interface GA4Property {
  propertyName: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  avgSessionDuration: number;
}

interface DeviceData {
  device: string;
  activeUsers: number;
  sessions: number;
  percentage: number;
}

interface PageData {
  pageTitle: string;
  activeUsers: number;
  screenPageViews: number;
  bounceRate: number;
  avgEngagementDuration: number;
}

interface SourceData {
  medium: string;
  label: string;
  activeUsers: number;
  percentage: number;
}

interface CountryData {
  country: string;
  activeUsers: number;
  percentage: number;
}

type Period = "last7days" | "last30days" | "thismonth";

const MEDIUM_LABELS: Record<string, string> = {
  "(none)": "Direct",
  "organic": "Organic Search",
  "referral": "Referral",
  "email": "Email",
  "rss": "RSS",
  "(not set)": "Other",
};

const GA4Dashboard = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";
  const [period, setPeriod] = useState<Period>("thismonth");

  const [overviewData, setOverviewData] = useState<GA4Property[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [topPages, setTopPages] = useState<PageData[]>([]);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [geography, setGeography] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const formatTime = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${rem}s`;
  };

  useEffect(() => {
    if (!clientSlug) return;
    setLoading(true);
    setError(null);

    const base = `/api/dataslayer-proxy?client=${clientSlug}`;

    Promise.all([
      fetch(`${base}&period=ga4_${period}`).then(r => r.json()),
      fetch(`${base}&type=ga4_devices&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=ga4_top_pages&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=ga4_sources&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=ga4_geography&period=${period}`).then(r => r.json()),
    ]).then(([overview, devices, pages, srcs, geo]) => {
      // Parse overview
      if (overview.result?.length > 1) {
        const [, ...rows] = overview.result;
        const propMap = new Map<string, { activeUsers: number; newUsers: number; sessions: number; engagementRate: number[]; bounceRate: number[]; avgSessionDuration: number[]; count: number }>();
        rows.forEach((row: (string | number)[]) => {
          const name = String(row[1]);
          if (!propMap.has(name)) propMap.set(name, { activeUsers: 0, newUsers: 0, sessions: 0, engagementRate: [], bounceRate: [], avgSessionDuration: [], count: 0 });
          const p = propMap.get(name)!;
          p.activeUsers += Number(row[2]);
          p.newUsers += Number(row[3]);
          p.sessions += Number(row[4]);
          p.engagementRate.push(Number(row[5]));
          p.bounceRate.push(Number(row[6]));
          p.avgSessionDuration.push(Number(row[7]));
          p.count++;
        });
        setOverviewData(Array.from(propMap.entries()).map(([propertyName, d]) => ({
          propertyName,
          activeUsers: d.activeUsers,
          newUsers: d.newUsers,
          sessions: d.sessions,
          engagementRate: d.engagementRate.reduce((a, b) => a + b, 0) / d.count,
          bounceRate: d.bounceRate.reduce((a, b) => a + b, 0) / d.count,
          avgSessionDuration: d.avgSessionDuration.reduce((a, b) => a + b, 0) / d.count,
        })));
      }

      // Parse devices
      if (devices.result?.length > 1) {
        const [, ...rows] = devices.result;
        const devMap = new Map<string, { activeUsers: number; sessions: number }>();
        rows.forEach((row: (string | number)[]) => {
          const dev = String(row[1]);
          if (!devMap.has(dev)) devMap.set(dev, { activeUsers: 0, sessions: 0 });
          const d = devMap.get(dev)!;
          d.activeUsers += Number(row[3]);
          d.sessions += Number(row[4]);
        });
        const total = Array.from(devMap.values()).reduce((s, d) => s + d.activeUsers, 0);
        setDeviceData(Array.from(devMap.entries()).map(([device, d]) => ({
          device,
          activeUsers: d.activeUsers,
          sessions: d.sessions,
          percentage: total > 0 ? (d.activeUsers / total) * 100 : 0,
        })).sort((a, b) => b.activeUsers - a.activeUsers));
      }

      // Parse top pages
      if (pages.result?.length > 1) {
        const [, ...rows] = pages.result;
        const pageMap = new Map<string, { activeUsers: number; screenPageViews: number; bounceRate: number[]; avgEngagementDuration: number[]; count: number }>();
        rows.forEach((row: (string | number)[]) => {
          const title = String(row[2]);
          if (!pageMap.has(title)) pageMap.set(title, { activeUsers: 0, screenPageViews: 0, bounceRate: [], avgEngagementDuration: [], count: 0 });
          const p = pageMap.get(title)!;
          p.activeUsers += Number(row[3]);
          p.screenPageViews += Number(row[4]);
          p.avgEngagementDuration.push(Number(row[5]));
          p.bounceRate.push(Number(row[6]));
          p.count++;
        });
        setTopPages(Array.from(pageMap.entries())
          .map(([pageTitle, d]) => ({
            pageTitle,
            activeUsers: d.activeUsers,
            screenPageViews: d.screenPageViews,
            bounceRate: d.bounceRate.reduce((a, b) => a + b, 0) / d.count,
            avgEngagementDuration: d.avgEngagementDuration.reduce((a, b) => a + b, 0) / d.count,
          }))
          .sort((a, b) => b.screenPageViews - a.screenPageViews)
          .slice(0, 10));
      }

      // Parse sources
      if (srcs.result?.length > 1) {
        const [, ...rows] = srcs.result;
        const srcMap = new Map<string, number>();
        rows.forEach((row: (string | number)[]) => {
          const medium = String(row[0]);
          srcMap.set(medium, (srcMap.get(medium) || 0) + Number(row[2]));
        });
        const total = Array.from(srcMap.values()).reduce((s, v) => s + v, 0);
        setSources(Array.from(srcMap.entries())
          .filter(([m]) => m !== "(not set)")
          .map(([medium, activeUsers]) => ({
            medium,
            label: MEDIUM_LABELS[medium] || medium,
            activeUsers,
            percentage: total > 0 ? (activeUsers / total) * 100 : 0,
          }))
          .sort((a, b) => b.activeUsers - a.activeUsers));
      }

      // Parse geography
      if (geo.result?.length > 1) {
        const [, ...rows] = geo.result;
        const countryMap = new Map<string, number>();
        rows.forEach((row: (string | number)[]) => {
          const country = String(row[0]);
          if (country && country !== "(not set)") {
            countryMap.set(country, (countryMap.get(country) || 0) + Number(row[3]));
          }
        });
        const total = Array.from(countryMap.values()).reduce((s, v) => s + v, 0);
        setGeography(Array.from(countryMap.entries())
          .map(([country, activeUsers]) => ({
            country,
            activeUsers,
            percentage: total > 0 ? (activeUsers / total) * 100 : 0,
          }))
          .sort((a, b) => b.activeUsers - a.activeUsers)
          .slice(0, 8));
      }

      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [clientSlug, period]);

  if (!clientSlug) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" /><p className="text-muted-foreground">Add ?client=name to the URL</p></div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </motion.div>
        <p className="text-muted-foreground">Loading Website Analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" /><p className="text-muted-foreground">{error}</p></div>
    </div>
  );

  const deviceIcons: Record<string, typeof Monitor> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
  const deviceColors: Record<string, string> = { desktop: "text-blue-600", mobile: "text-purple-600", tablet: "text-emerald-600" };
  const deviceBg: Record<string, string> = { desktop: "bg-blue-50", mobile: "bg-purple-50", tablet: "bg-emerald-50" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest">Website Analytics</p>
              <h1 className="text-3xl font-extrabold text-foreground">GA4 Dashboard</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{clientSlug}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-1">
            {(["last7days", "last30days", "thismonth"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {p === "last7days" ? "Last 7 Days" : p === "last30days" ? "Last 30 Days" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {overviewData.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-green-600" /><h2 className="text-lg font-bold">Property Overview</h2></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {overviewData.map((prop, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 truncate">{prop.propertyName}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">Active Users</span><span className="font-bold">{formatNumber(prop.activeUsers)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">New Users</span><span className="font-bold">{formatNumber(prop.newUsers)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</span><span className="font-bold">{formatNumber(prop.sessions)}</span></div>
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">Engagement</span><span className="text-sm font-semibold text-green-600">{prop.engagementRate.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">Bounce Rate</span><span className="text-sm font-semibold text-amber-600">{prop.bounceRate.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Session</span><span className="text-sm font-semibold">{formatTime(prop.avgSessionDuration)}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Devices */}
        {deviceData.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4"><Monitor className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-bold">Devices</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deviceData.map((d, i) => {
                const Icon = deviceIcons[d.device] || Monitor;
                return (
                  <div key={i} className="bg-card border border-border rounded-xl p-6">
                    <div className={`w-10 h-10 rounded-lg ${deviceBg[d.device] || "bg-gray-50"} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${deviceColors[d.device] || "text-gray-600"}`} />
                    </div>
                    <p className="text-2xl font-bold mb-1">{formatNumber(d.activeUsers)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide capitalize mb-2">{d.device}</p>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${d.percentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.percentage.toFixed(1)}% of users</p>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Traffic Sources + Geography side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          {sources.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-purple-600" /><h2 className="text-lg font-bold">Traffic Sources</h2></div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                {sources.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-muted-foreground">{formatNumber(s.activeUsers)} ({s.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.percentage}%` }} transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full bg-purple-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {geography.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-emerald-600" /><h2 className="text-lg font-bold">Top Countries</h2></div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                {geography.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.country}</span>
                      <span className="text-muted-foreground">{formatNumber(c.activeUsers)} ({c.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.percentage}%` }} transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Top Pages */}
        {topPages.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-amber-600" /><h2 className="text-lg font-bold">Top Pages</h2></div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-6">Page</div>
                <div className="col-span-2 text-right">Views</div>
                <div className="col-span-2 text-right">Users</div>
                <div className="col-span-2 text-right">Bounce</div>
              </div>
              {topPages.map((p, i) => (
                <div key={i} className={`grid grid-cols-12 gap-4 px-6 py-4 text-sm ${i % 2 === 0 ? "" : "bg-muted/20"} border-t border-border`}>
                  <div className="col-span-6 font-medium text-foreground truncate" title={p.pageTitle}>{p.pageTitle}</div>
                  <div className="col-span-2 text-right font-semibold">{formatNumber(p.screenPageViews)}</div>
                  <div className="col-span-2 text-right text-muted-foreground">{formatNumber(p.activeUsers)}</div>
                  <div className="col-span-2 text-right text-amber-600">{p.bounceRate.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default GA4Dashboard;
