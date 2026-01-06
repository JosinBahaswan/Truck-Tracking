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
import { TrendingUp } from 'lucide-react';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-gray-900">{payload[0].payload.month}</p>
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

export default function ChartAreaGradient() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-6 pb-0">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Area Chart - Gradient</h3>
        <p className="text-sm text-gray-600">Showing total visitors for the last 6 months</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
              strokeOpacity={0.5}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />

            <YAxis hide />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(99, 102, 241, 0.1)', strokeWidth: 2 }}
            />

            <Area
              dataKey="mobile"
              type="monotone"
              fill="url(#fillMobile)"
              fillOpacity={1}
              stroke="#10b981"
              strokeWidth={3}
              stackId="a"
              name="Mobile"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />

            <Area
              dataKey="desktop"
              type="monotone"
              fill="url(#fillDesktop)"
              fillOpacity={1}
              stroke="#2563eb"
              strokeWidth={3}
              stackId="a"
              name="Desktop"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              Trending up by 5.2% this month
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 text-gray-600">January - June 2024</div>
          </div>
        </div>
      </div>
    </div>
  );
}
