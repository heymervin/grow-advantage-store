import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { calculateHealthStatus } from './property-grid-utils';

interface DailyDataPoint {
  date: string;
  activeUsers: number;
  sessions: number;
}

interface Props {
  propertyId: string;
  propertyName: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  dailyData: DailyDataPoint[];
  previousPeriodUsers?: number; // for trend calculation
  onClick: () => void;
}

/**
 * PropertyMiniCard - Compact card showing one property's key metrics
 *
 * Features:
 * - Sparkline for trend visualization
 * - Health status indicator (green/yellow/red border)
 * - Entire card is clickable
 * - Size: ~300-350px wide, 140-160px tall
 *
 * Usage:
 * <PropertyMiniCard
 *   propertyId="123456789"
 *   propertyName="insideoutstyleblog.com"
 *   activeUsers={1234}
 *   sessions={2456}
 *   engagementRate={0.67}
 *   bounceRate={0.33}
 *   dailyData={[...]}
 *   previousPeriodUsers={1100}
 *   onClick={() => navigate(`/property/123456789`)}
 * />
 */
export const PropertyMiniCard = React.memo(function PropertyMiniCard({
  propertyId,
  propertyName,
  activeUsers,
  sessions,
  engagementRate,
  bounceRate,
  dailyData,
  previousPeriodUsers,
  onClick,
}: Props) {
  const health = calculateHealthStatus(activeUsers, previousPeriodUsers);

  // Calculate trend percentage
  const trendPercentage = previousPeriodUsers && previousPeriodUsers > 0
    ? ((activeUsers - previousPeriodUsers) / previousPeriodUsers) * 100
    : null;

  const isPositiveTrend = trendPercentage !== null && trendPercentage >= 0;

  // Health status styles with background tint for warning/critical
  const healthStyles = {
    healthy: 'border-l-4 border-l-emerald-500',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-500 ring-1 ring-amber-200 dark:ring-amber-800',
    critical: 'bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-500 ring-1 ring-red-200 dark:ring-red-800',
  }[health];

  // Trend color
  const trendColorClass = isPositiveTrend ? 'text-emerald-600' : 'text-red-600';

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  // Format percentage (value is already a percentage 0-100, not decimal)
  const formatPercent = (percentage: number) => {
    return `${Math.round(percentage)}%`;
  };

  return (
    <div
      onClick={onClick}
      className={`
        group bg-card border ${healthStyles}
        rounded-2xl p-4 lg:p-5
        hover:shadow-lg transition-shadow duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        w-full min-h-[180px] lg:min-h-[200px]
        flex flex-col justify-between overflow-hidden
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${propertyName}`}
    >
      {/* Header: Property Name */}
      <div className="text-base font-bold text-foreground truncate flex items-center gap-1.5" title={propertyName}>
        {propertyName}
        {health === 'critical' && (
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" aria-label="Critical status" />
        )}
      </div>

      {/* Main Metric: Active Users + Trend */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatNumber(activeUsers)}
          </span>
          <span className="text-sm text-muted-foreground">users</span>
        </div>
        {trendPercentage !== null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColorClass}`}>
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(Math.round(trendPercentage))}%</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-10 -mx-1 overflow-hidden">
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={dailyData}>
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke={isPositiveTrend ? '#10b981' : '#ef4444'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No trend data
          </div>
        )}
      </div>

      {/* Secondary Metrics + hover CTA */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Sessions: <span className="font-medium text-foreground">{formatNumber(sessions)}</span></span>
        <span>Engaged: <span className="font-medium text-foreground">{formatPercent(engagementRate)}</span></span>
      </div>

      {/* View Dashboard hint — visible on hover */}
      <div className="flex justify-end mt-1">
        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          View Dashboard &rarr;
        </span>
      </div>
    </div>
  );
});
