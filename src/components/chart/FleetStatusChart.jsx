import React from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0">
        <p className="font-semibold text-base mb-1">{payload[0].name}</p>
        <p className="text-sm text-gray-200">
          Vehicles: <span className="font-bold text-white ml-1">{payload[0].value}</span>
        </p>
        <p className="text-sm text-gray-300">
          {payload[0].payload.percentage}% of total fleet
        </p>
      </div>
    );
  }
  return null;
};

const renderLabel = (entry) => {
  return `${entry.percentage}%`;
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
      <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <div className="h-7 bg-gray-200 rounded w-2/3 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="flex-1">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // Validate data after loading
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('⚠️ FleetStatusChart - Invalid or empty data');
    return (
      <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-xl text-gray-900">Fleet Status Distribution</h3>
          <p className="text-sm text-gray-500 mt-1">Current vehicle status breakdown</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">No data available</p>
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

  // Color mapping dengan gradasi yang lebih modern
  const COLORS = {
    Active: '#10b981',
    Maintenance: '#f59e0b',
    Inactive: '#ef4444',
    Idle: '#6b7280',
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm p-6" id="fleet-status-chart-container">
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-semibold text-xl text-gray-900">Fleet Status Distribution</h3>
        <p className="text-sm text-gray-500 mt-1">Current vehicle status breakdown</p>
      </div>

      {/* Chart Container */}
      <div className="flex-1" id="fleet-chart-wrapper">
        <ResponsiveContainer width="100%" height={300} id="fleet-responsive-container" key={chartKey}>
          <PieChart id="fleet-status-pie-chart" key={`fleet-pie-${chartKey}`}>
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ 
                paddingTop: '20px',
                paddingBottom: '10px'
              }}
              iconType="circle"
              iconSize={10}
              formatter={(value) => (
                <span className="text-sm text-gray-700 font-medium">
                  {value}
                </span>
              )}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              cornerRadius={8}
              label={renderLabel}
              labelLine={false}
              strokeWidth={0}
              id="fleet-pie-element"
              animationBegin={300}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`fleet-cell-${index}`} 
                  fill={COLORS[entry.name] || '#8884d8'}
                  strokeWidth={2}
                  stroke="white"
                  opacity={0.9}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Info - Minimal */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{total}</span> total vehicles
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">
              {chartData.find((d) => d.name === 'Active')?.percentage || 0}%
            </span> active
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FleetStatusChart);