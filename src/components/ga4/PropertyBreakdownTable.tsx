import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PropertyMetrics {
  propertyId: string;
  propertyName: string;
  users: number;
  sessions: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
}

interface PropertyBreakdownTableProps {
  properties: PropertyMetrics[];
  onPropertyClick: (propertyId: string) => void;
}

type SortField = keyof Omit<PropertyMetrics, 'propertyId' | 'propertyName'>;
type SortDirection = 'asc' | 'desc' | null;

export const PropertyBreakdownTable: React.FC<PropertyBreakdownTableProps> = ({
  properties,
  onPropertyClick,
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProperties = useMemo(() => {
    if (!sortField || !sortDirection) {
      return properties;
    }

    return [...properties].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [properties, sortField, sortDirection]);

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Property</th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('users')}
                >
                  <div className="flex items-center justify-end">
                    Users
                    <SortIcon field="users" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('sessions')}
                >
                  <div className="flex items-center justify-end">
                    Sessions
                    <SortIcon field="sessions" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('pageviews')}
                >
                  <div className="flex items-center justify-end">
                    Pageviews
                    <SortIcon field="pageviews" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('bounceRate')}
                >
                  <div className="flex items-center justify-end">
                    Bounce Rate
                    <SortIcon field="bounceRate" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('avgSessionDuration')}
                >
                  <div className="flex items-center justify-end">
                    Avg. Duration
                    <SortIcon field="avgSessionDuration" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('conversions')}
                >
                  <div className="flex items-center justify-end">
                    Conversions
                    <SortIcon field="conversions" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProperties.map((property) => (
                <tr
                  key={property.propertyId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onPropertyClick(property.propertyId)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                      {property.propertyName}
                    </button>
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatNumber(property.users)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatNumber(property.sessions)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatNumber(property.pageviews)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatPercentage(property.bounceRate)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDuration(property.avgSessionDuration)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatNumber(property.conversions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
