import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-gray-900">{payload[0].payload.day}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 text-sm">
              {entry.name}: <span className="font-semibold text-gray-900">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AlertTrendsChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 pb-0">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="h-72 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const totalAlerts = data.reduce(
    (sum, item) => sum + (item.critical || 0) + (item.warning || 0) + (item.info || 0),
    0
  );
  const criticalAlerts = data.reduce((sum, item) => sum + (item.critical || 0), 0);
  const avgDaily = data.length > 0 ? (totalAlerts / data.length).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900">Alert Trends</h3>
        </div>
        <p className="text-sm text-gray-600">Daily alert distribution by severity</p>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar
              dataKey="critical"
              fill="#ef4444"
              name="Critical"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Bar
              dataKey="warning"
              fill="#f59e0b"
              name="Warning"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Bar
              dataKey="info"
              fill="#3b82f6"
              name="Info"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-6 pb-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Alerts This Week:</span>
            <span className="font-semibold text-gray-900">{totalAlerts}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Critical Alerts:</span>
            <span className="font-semibold text-red-600">{criticalAlerts}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Daily Average:</span>
            <span className="font-semibold text-gray-900">{avgDaily}</span>
          </div>
          {criticalAlerts === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium mt-2">
              <TrendingDown className="h-4 w-4" />
              No critical alerts this week
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
