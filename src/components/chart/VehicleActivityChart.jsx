import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-gray-900">{payload[0].payload.month}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 text-sm">
              {entry.name}: <span className="font-semibold text-gray-900">{entry.value} hrs</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function VehicleActivityChart({ data, loading }) {
  // Dummy data untuk vehicle activity (jam operasional per bulan)
  const dummyData = [
    { month: 'January', hours: 3200 },
    { month: 'February', hours: 2800 },
    { month: 'March', hours: 3500 },
    { month: 'April', hours: 3100 },
    { month: 'May', hours: 3400 },
    { month: 'June', hours: 3600 },
  ];

  const chartData = data && data.length > 0 ? data : dummyData;

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

  // Calculate trend
  const recentData = chartData.slice(-2);
  const trend =
    recentData.length === 2
      ? ((recentData[1].hours - recentData[0].hours) / recentData[0].hours) * 100
      : 0;
  const isTrendingUp = trend > 0;
  const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);
  const avgHours = chartData.length > 0 ? (totalHours / chartData.length).toFixed(0) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">Vehicle Activity</h3>
        </div>
        <p className="text-sm text-gray-600">Monthly operational hours across fleet</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99, 102, 241, 0.1)', strokeWidth: 2 }} />

            <Area
              type="monotone"
              dataKey="hours"
              name="Operating Hours"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#fillActivity)"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Average/Month</p>
            <p className="text-2xl font-bold text-gray-900">{avgHours}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Monthly Trend</p>
            <div className="flex items-center gap-2">
              {isTrendingUp ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`text-xl font-bold ${
                  isTrendingUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
