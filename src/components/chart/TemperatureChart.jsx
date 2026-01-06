import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Thermometer, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-gray-900">{payload[0].payload.time}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 text-sm">
              {entry.name}: <span className="font-semibold text-gray-900">{entry.value}°C</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TemperatureChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 pb-0">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const avgTemp =
    data.length > 0
      ? (data.reduce((sum, item) => sum + (item.average || 0), 0) / data.length).toFixed(1)
      : 0;
  const maxTemp = Math.max(...data.map((item) => item.max || 0));
  const highTempCount = data.filter((item) => (item.max || 0) > 80).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="h-5 w-5 text-orange-500" />
          <h3 className="text-xl font-semibold text-gray-900">Hub Temperature</h3>
        </div>
        <p className="text-sm text-gray-600">Real-time temperature monitoring</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="fillMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillAverage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
              strokeOpacity={0.5}
            />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}°C`}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(239, 68, 68, 0.1)', strokeWidth: 2 }}
            />

            <Area
              dataKey="average"
              type="monotone"
              fill="url(#fillAverage)"
              fillOpacity={1}
              stroke="#f59e0b"
              strokeWidth={3}
              name="Average"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />

            <Area
              dataKey="max"
              type="monotone"
              fill="url(#fillMax)"
              fillOpacity={1}
              stroke="#ef4444"
              strokeWidth={3}
              name="Max"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Average Temperature:</span>
            <span className="font-semibold text-gray-900">{avgTemp}°C</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Peak Temperature:</span>
            <span className="font-semibold text-red-600">{maxTemp}°C</span>
          </div>
          {highTempCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 font-medium mt-2">
              <TrendingUp className="h-4 w-4" />
              {highTempCount} reading{highTempCount > 1 ? 's' : ''} above normal threshold
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
