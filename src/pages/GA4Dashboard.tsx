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
      fetch(`${base}&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=devices&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=top_pages&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=sources&period=${period}`).then(r => r.json()),
      fetch(`${base}&type=geography&period=${period}`).then(r => r.json()),
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <HeroStats current={data.overview} previous={comparison?.overview ?? null} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <TrendChart current={data.overview} previous={comparison?.overview ?? null} />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ChannelChart sources={data.sources} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <TopPagesList pages={data.pages} />
          </motion.div>
        </div>

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
