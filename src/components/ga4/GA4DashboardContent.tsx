import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, Calendar } from 'lucide-react';
import type { OverviewMetrics, DeviceData, PageData, SourceData, CountryData, Period } from './types';
import { getPreviousPeriodDates } from './utils';
import {
  parseOverview, parseDevices, parsePages, parseSources, parseGeography,
  parseChannelQuality, parseHeatmap, parseVideoEvents, parseNewReturning,
  parseLandingPages, parseStickiness,
} from './parsers';
import type {
  ChannelQualityRow, HeatmapRow, VideoEventRow, NewReturningSegment,
  LandingPageRow, StickinessData,
} from './parsers';
import HeroStats from './HeroStats';
import TrendChart from './TrendChart';
import ChannelChart from './ChannelChart';
import TopPagesList from './TopPagesList';
import DeviceDonut from './DeviceDonut';
import GeographyList from './GeographyList';
import ChannelQualityChart from './ChannelQualityChart';
import HeatmapChart from './HeatmapChart';
import VideoWidget from './VideoWidget';
import NewReturningWidget from './NewReturningWidget';
import LandingPagesTable from './LandingPagesTable';
import StickinessCard from './StickinessCard';
import PropertySelector from './PropertySelector';
import { PropertyGridView } from './PropertyGridView';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
];

const SectionLoader = ({ loading, children, height = 'h-48' }: { loading: boolean; children: React.ReactNode; height?: string }) => {
  if (!loading) return <>{children}</>;
  return (
    <div className={`flex items-center justify-center ${height} bg-card border border-border rounded-xl`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
};

interface Props {
  clientSlug: string;
}

const GA4DashboardContent = ({ clientSlug }: Props) => {
  const [period, setPeriod] = useState<Period>('thismonth');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Section data — each loads independently
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [comparison, setComparison] = useState<OverviewMetrics | null>(null);
  const [devices, setDevices] = useState<DeviceData[] | null>(null);
  const [pages, setPages] = useState<PageData[] | null>(null);
  const [sources, setSources] = useState<SourceData[] | null>(null);
  const [geography, setGeography] = useState<CountryData[] | null>(null);
  const [channelQuality, setChannelQuality] = useState<ChannelQualityRow[] | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapRow[] | null>(null);
  const [videoEvents, setVideoEvents] = useState<VideoEventRow[] | null>(null);
  const [newReturning, setNewReturning] = useState<NewReturningSegment[] | null>(null);
  const [landingPages, setLandingPages] = useState<LandingPageRow[] | null>(null);
  const [stickiness, setStickinessState] = useState<StickinessData | null>(null);
  const [propertyBreakdown, setPropertyBreakdown] = useState<any[]>([]);

  // Per-section loading flags
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const setDone = (key: string) => setLoadingMap(prev => ({ ...prev, [key]: false }));

  useEffect(() => {
    if (!clientSlug) return;

    // Reset everything to loading state
    setError(null);
    setOverview(null);
    setComparison(null);
    setDevices(null);
    setPages(null);
    setSources(null);
    setGeography(null);
    setChannelQuality(null);
    setHeatmap(null);
    setVideoEvents(null);
    setNewReturning(null);
    setLandingPages(null);
    setStickinessState(null);
    setPropertyBreakdown([]);
    setLoadingMap({
      overview: true, comparison: true, devices: true, pages: true,
      sources: true, geography: true, channelQuality: true, heatmap: true,
      videoEvents: true, newReturning: true, landingPages: true, stickiness: true,
    });

    const propertyParam = selectedProperty ? `&property=${selectedProperty}` : '';
    const base = `/api/ga4?client=${clientSlug}${propertyParam}`;
    const { startDate, endDate } = getPreviousPeriodDates(period);
    const prevParams = `startDate=${startDate}&endDate=${endDate}&period=${period}`;

    const fetchSection = async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 401 && data.needsReauth) {
        window.location.href = data.reconnectUrl || `/connect?client=${clientSlug}`;
        throw new Error('Redirecting to reconnect...');
      }
      if (res.status === 404 && data.error?.includes('No GA4 connection')) {
        setError('NOT_CONNECTED');
        throw new Error('NOT_CONNECTED');
      }
      if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
      return data;
    };

    // Fire all fetches independently — each resolves and renders on its own
    fetchSection(`${base}&period=${period}`)
      .then(data => {
        setOverview(parseOverview(data));
        setPropertyBreakdown(data.propertyBreakdown ?? []);
      })
      .catch(() => {})
      .finally(() => setDone('overview'));

    fetchSection(`${base}&${prevParams}`)
      .then(data => setComparison(parseOverview(data)))
      .catch(() => {})
      .finally(() => setDone('comparison'));

    fetchSection(`${base}&type=devices&period=${period}`)
      .then(data => setDevices(parseDevices(data)))
      .catch(() => {})
      .finally(() => setDone('devices'));

    fetchSection(`${base}&type=top_pages&period=${period}`)
      .then(data => setPages(parsePages(data)))
      .catch(() => {})
      .finally(() => setDone('pages'));

    fetchSection(`${base}&type=sources&period=${period}`)
      .then(data => setSources(parseSources(data)))
      .catch(() => {})
      .finally(() => setDone('sources'));

    fetchSection(`${base}&type=geography&period=${period}`)
      .then(data => setGeography(parseGeography(data)))
      .catch(() => {})
      .finally(() => setDone('geography'));

    fetchSection(`${base}&type=channel_quality&period=${period}`)
      .then(data => setChannelQuality(parseChannelQuality(data)))
      .catch(() => {})
      .finally(() => setDone('channelQuality'));

    fetchSection(`${base}&type=heatmap&period=${period}`)
      .then(data => setHeatmap(parseHeatmap(data)))
      .catch(() => {})
      .finally(() => setDone('heatmap'));

    fetchSection(`${base}&type=video_events&period=${period}`)
      .then(data => setVideoEvents(parseVideoEvents(data)))
      .catch(() => {})
      .finally(() => setDone('videoEvents'));

    fetchSection(`${base}&type=new_returning&period=${period}`)
      .then(data => setNewReturning(parseNewReturning(data)))
      .catch(() => {})
      .finally(() => setDone('newReturning'));

    fetchSection(`${base}&type=landing_pages&period=${period}`)
      .then(data => setLandingPages(parseLandingPages(data)))
      .catch(() => {})
      .finally(() => setDone('landingPages'));

    fetchSection(`${base}&type=stickiness&period=${period}`)
      .then(data => setStickinessState(parseStickiness(data)))
      .catch(() => {})
      .finally(() => setDone('stickiness'));
  }, [clientSlug, period, selectedProperty]);

  // Show a full-page spinner only until the overview (hero stats) loads for the first time
  const initialLoading = loadingMap.overview && overview === null;

  if (initialLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center"
        >
          <Globe className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-muted-foreground text-sm">Loading website analytics...</p>
      </div>
    </div>
  );

  if (error === 'NOT_CONNECTED') return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-semibold mb-1">Google Analytics Not Connected</p>
        <p className="text-muted-foreground text-sm mb-5">
          Connect your Google Analytics account to view website analytics for this client.
        </p>
        <a
          href={`/connect?client=${clientSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Connect Google Analytics
        </a>
      </div>
    </div>
  );

  if (error && error !== 'NOT_CONNECTED') return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Period and Property selectors */}
      <div className="flex flex-wrap items-center gap-4">
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
        <PropertySelector
          clientSlug={clientSlug}
          selectedProperty={selectedProperty}
          onPropertyChange={setSelectedProperty}
        />
      </div>

      {/* Property grid view when no specific property selected */}
      {!selectedProperty && (
        <SectionLoader loading={loadingMap.overview} height="h-48">
          {propertyBreakdown.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <PropertyGridView
                properties={propertyBreakdown}
                onPropertyClick={setSelectedProperty}
              />
            </motion.div>
          )}
        </SectionLoader>
      )}

      {/* Detailed charts only when a specific property is selected */}
      {selectedProperty && (
        <>
          <SectionLoader loading={loadingMap.overview} height="h-32">
            {overview && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <HeroStats current={overview} previous={comparison ?? null} />
              </motion.div>
            )}
          </SectionLoader>

          <SectionLoader loading={loadingMap.overview} height="h-48">
            {overview && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <TrendChart current={overview} previous={comparison ?? null} />
              </motion.div>
            )}
          </SectionLoader>

          <div className="grid md:grid-cols-2 gap-4">
            <SectionLoader loading={loadingMap.sources} height="h-48">
              {sources && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <ChannelChart sources={sources} />
                </motion.div>
              )}
            </SectionLoader>
            <SectionLoader loading={loadingMap.pages} height="h-48">
              {pages && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <TopPagesList pages={pages} />
                </motion.div>
              )}
            </SectionLoader>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <SectionLoader loading={loadingMap.newReturning} height="h-48">
              {newReturning && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <NewReturningWidget data={newReturning} />
                </motion.div>
              )}
            </SectionLoader>
            <SectionLoader loading={loadingMap.stickiness} height="h-48">
              {stickiness !== null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <StickinessCard data={stickiness} />
                </motion.div>
              )}
            </SectionLoader>
          </div>

          <SectionLoader loading={loadingMap.channelQuality} height="h-48">
            {channelQuality && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <ChannelQualityChart data={channelQuality} />
              </motion.div>
            )}
          </SectionLoader>

          <SectionLoader loading={loadingMap.landingPages} height="h-48">
            {landingPages && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <LandingPagesTable data={landingPages} />
              </motion.div>
            )}
          </SectionLoader>

          <SectionLoader loading={loadingMap.videoEvents} height="h-32">
            {videoEvents && videoEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <VideoWidget data={videoEvents} />
              </motion.div>
            )}
          </SectionLoader>

          <div className="grid md:grid-cols-2 gap-4">
            <SectionLoader loading={loadingMap.devices} height="h-48">
              {devices && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  <DeviceDonut devices={devices} />
                </motion.div>
              )}
            </SectionLoader>
            <SectionLoader loading={loadingMap.geography} height="h-48">
              {geography && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <GeographyList countries={geography} />
                </motion.div>
              )}
            </SectionLoader>
          </div>

          <SectionLoader loading={loadingMap.heatmap} height="h-48">
            {heatmap && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <HeatmapChart data={heatmap} />
              </motion.div>
            )}
          </SectionLoader>
        </>
      )}
    </div>
  );
};

export default GA4DashboardContent;
