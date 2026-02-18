import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle } from 'lucide-react';
import GA4DashboardContent from '../components/ga4/GA4DashboardContent';

const GA4Dashboard = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get('client') ?? '';

  if (!clientSlug) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Add ?client=name to the URL</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Globe className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Website Analytics</p>
              <h1 className="text-xl font-extrabold text-foreground leading-tight">GA4 Dashboard</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <GA4DashboardContent clientSlug={clientSlug} />
      </div>
    </div>
  );
};

export default GA4Dashboard;
