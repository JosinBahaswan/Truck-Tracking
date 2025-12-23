import React from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          Vehicles: <span className="font-semibold">{payload[0].value}</span>
        </p>
        <p className="text-xs text-gray-500">
          {payload[0].payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

const renderLabel = (entry) => {
  return `${entry.name}: ${entry.value}`;
};

const FleetStatusChart = ({ data, loading }) => {
  console.log('🔵 FleetStatusChart - Received data:', data, 'Loading:', loading);
  
  // Force component update when data changes
  const [chartKey, setChartKey] = React.useState(0);
  
  React.useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setChartKey(prev => prev + 1);
    }
  }, [data]);
  
  // Show loading skeleton first
  if (loading) {
    return (
      <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="items-center pb-0 p-6">
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="flex-1 pb-0 p-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // Validate data after loading
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('⚠️ FleetStatusChart - Invalid or empty data');
    return (
      <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center space-y-1.5 p-6">
          <h3 className="font-semibold text-xl tracking-tight">Fleet Status Distribution</h3>
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }
  
  // Calculate percentages and prepare data
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }));

  console.log('📈 FleetStatusChart - Processed chartData:', chartData, 'Total:', total);

  // Color mapping
  const COLORS = {
    Active: '#10b981',
    Maintenance: '#f59e0b',
    Inactive: '#ef4444',
    Idle: '#6b7280',
  };

  const activeVehicles = chartData.find((d) => d.name === 'Active')?.value || 0;
  const changePercentage = 2.5; // This could come from API comparing with previous period

  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm" id="fleet-status-chart-container">
      <div className="flex flex-col items-center space-y-1.5 p-6 pb-0">
        <h3 className="font-semibold text-xl tracking-tight">Fleet Status Distribution</h3>
        <p className="text-sm text-gray-500">Current vehicle status breakdown</p>
      </div>

      <div className="flex-1 p-6 pb-0" id="fleet-chart-wrapper">
        <ResponsiveContainer width="100%" height={280} id="fleet-responsive-container" key={chartKey}>
          <PieChart id="fleet-status-pie-chart" key={`fleet-pie-${chartKey}`}>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry) => (
                <span className="text-sm text-gray-700">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={renderLabel}
              labelLine={false}
              id="fleet-pie-element"
            >
              {chartData.map((entry, index) => (
                <Cell key={`fleet-cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2 text-sm p-6 pt-4">
        <div className="flex items-center gap-2 leading-none font-medium text-gray-900">
          Fleet utilization up by {changePercentage}% this week{' '}
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-gray-500 leading-none">
          {activeVehicles} vehicles currently active out of {total} total
        </div>
      </div>
    </div>
  );
};

export default React.memo(FleetStatusChart);
