import React from 'react';
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          Tires: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const TirePressureChart = ({ data, loading }) => {
  console.log('🟢 TirePressureChart - Received data:', data, 'Loading:', loading);
  
  // Force component update when data changes
  const [chartKey, setChartKey] = React.useState(0);
  
  React.useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setChartKey(prev => prev + 1);
      console.log('🔄 TirePressureChart - chartKey updated');
    }
  }, [data]);
  
  // Show loading skeleton
  if (loading) {
    console.log('⏳ TirePressureChart - Loading state');
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
  
  // Validate data after loading - check if we have valid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('⚠️ TirePressureChart - Invalid or empty data');
    return (
      <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="items-center pb-0 p-6">
          <h3 className="font-semibold text-xl tracking-tight">Tire Pressure Status</h3>
          <p className="text-sm text-gray-500 mt-1">No data available</p>
        </div>
      </div>
    );
  }
  
  // Check if all values are 0 (no real data)
  const hasRealData = data.some(item => item.value > 0);
  if (!hasRealData) {
    console.warn('⚠️ TirePressureChart - All values are 0');
    return (
      <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="items-center pb-0 p-6">
          <h3 className="font-semibold text-xl tracking-tight">Tire Pressure Status</h3>
          <p className="text-sm text-gray-500 mt-1">No tire data available</p>
        </div>
      </div>
    );
  }
  
  // Use default data if invalid
  const validData = (data && Array.isArray(data) && data.length > 0) 
    ? data 
    : [
        { name: 'Normal', value: 0 },
        { name: 'Warning', value: 0 },
        { name: 'Critical', value: 0 },
        { name: 'No Data', value: 0 }
      ];
  
  console.log('🔍 TirePressureChart - Using data:', validData);
  
  // Color mapping for tire status
  const COLORS = {
    Normal: '#10b981',
    Warning: '#f59e0b',
    Critical: '#ef4444',
    'No Data': '#9ca3af',
  };

  const chartData = validData.map((item) => ({
    ...item,
    fill: COLORS[item.name] || '#9ca3af',
  }));

  const totalTires = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const criticalCount = chartData.find((d) => d.name === 'Critical')?.value || 0;
  const warningCount = chartData.find((d) => d.name === 'Warning')?.value || 0;
  const needsAttention = criticalCount + warningCount;

  console.log('📊 TirePressureChart - Total:', totalTires, 'Needs attention:', needsAttention);
  console.log('✅ TirePressureChart - Rendering chart');
  
  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm" id="tire-pressure-chart-container">
      <div className="items-center pb-0 p-6">
        <h3 className="font-semibold text-xl tracking-tight">Tire Pressure Status</h3>
        <p className="text-sm text-gray-500 mt-1">Real-time TPMS monitoring</p>
      </div>

      <div className="flex-1 pb-0 p-6" id="tire-chart-wrapper">
        <ResponsiveContainer width="100%" height={250} id="tire-responsive-container" key={chartKey}>
          <PieChart id="tire-pressure-pie-chart" key={`tire-pie-${chartKey}`}>
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
              paddingAngle={2}
              id="tire-pie-element"
            >
              {chartData.map((entry, index) => (
                <Cell key={`tire-cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-gray-900 text-3xl font-bold"
                        >
                          {totalTires.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-gray-500">
                          Total Tires
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-col gap-2 text-sm p-6 pt-2">
        {needsAttention > 0 ? (
          <div className="flex items-center gap-2 leading-none font-medium text-amber-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            {needsAttention} tire{needsAttention > 1 ? 's' : ''} need{needsAttention === 1 ? 's' : ''}{' '}
            attention
          </div>
        ) : (
          <div className="flex items-center gap-2 leading-none font-medium text-green-600 mb-2">
            All tires within normal range <TrendingUp className="h-4 w-4" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
              <span className="text-xs text-gray-600">
                {item.name}: <span className="font-semibold">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TirePressureChart);
