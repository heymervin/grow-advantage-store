import { PropertyMiniCard } from './PropertyMiniCard';

interface DailyDataPoint {
  date: string;
  activeUsers: number;
  sessions: number;
}

interface PropertyData {
  property_id: string;
  property_name: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  dailyData: DailyDataPoint[];
  previousPeriodUsers?: number;
}

interface Props {
  properties: PropertyData[];
  onPropertyClick: (propertyId: string) => void;
  loading?: boolean;
  error?: string;
}

type HealthStatus = 'critical' | 'warning' | 'healthy';

/**
 * PropertyGridView - Responsive grid of property cards
 *
 * Features:
 * - Sorts by health status (critical/warning first)
 * - 2 columns on desktop, 1 on mobile
 * - Handles loading and error states
 *
 * Usage:
 * <PropertyGridView
 *   properties={propertyData}
 *   onPropertyClick={(id) => setSelectedProperty(id)}
 *   loading={isLoading}
 *   error={errorMessage}
 * />
 */
export function PropertyGridView({ properties, onPropertyClick, loading, error }: Props) {
  // Calculate health status for a property
  const getHealthStatus = (property: PropertyData): HealthStatus => {
    if (!property.previousPeriodUsers || property.previousPeriodUsers === 0) {
      return 'healthy';
    }
    const change = (property.activeUsers - property.previousPeriodUsers) / property.previousPeriodUsers;
    if (change < -0.5) return 'critical'; // down >50%
    if (change < -0.2) return 'warning';  // down 20-50%
    return 'healthy';
  };

  // Sort properties by health status (critical > warning > healthy), then by users
  const sortedProperties = [...properties].sort((a, b) => {
    const healthOrder = { critical: 0, warning: 1, healthy: 2 };
    const healthA = getHealthStatus(a);
    const healthB = getHealthStatus(b);

    if (healthA !== healthB) {
      return healthOrder[healthA] - healthOrder[healthB];
    }

    // Same health status - sort by active users descending
    return b.activeUsers - a.activeUsers;
  });

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-4 w-full h-[160px] animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-10 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card border border-red-200 rounded-2xl p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Failed to load properties</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="text-muted-foreground">No properties to display</div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedProperties.map((property) => (
        <PropertyMiniCard
          key={property.property_id}
          propertyId={property.property_id}
          propertyName={property.property_name}
          activeUsers={property.activeUsers}
          sessions={property.sessions}
          engagementRate={property.engagementRate}
          bounceRate={property.bounceRate}
          dailyData={property.dailyData}
          previousPeriodUsers={property.previousPeriodUsers}
          onClick={() => onPropertyClick(property.property_id)}
        />
      ))}
    </div>
  );
}
