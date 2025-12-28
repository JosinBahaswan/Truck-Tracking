import React from 'react';
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer, Sector } from 'recharts';
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

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 18}
        outerRadius={outerRadius + 28}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
        opacity={0.6}
      />
    </g>
  );
};

const TirePressureChart = ({ data, loading }) => {
  console.log('🟢 TirePressureChart - Received data:', data, 'Loading:', loading);
  
  // Force component update when data changes
  const [chartKey, setChartKey] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
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

  const activeData = chartData[activeIndex];
  
  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm" id="tire-pressure-chart-container">
      <div className="flex flex-row items-start space-y-0 pb-0 p-6">
        <div className="grid gap-1">
          <h3 className="font-semibold leading-none tracking-tight">Tire Pressure Status</h3>
          <p className="text-xs text-gray-500 mt-1">Real-time TPMS monitoring</p>
        </div>
        <select
          className="ml-auto h-7 w-[130px] rounded-lg border border-gray-300 pl-2.5 pr-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white cursor-pointer"
          value={activeIndex}
          onChange={(e) => setActiveIndex(Number(e.target.value))}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '12px',
          }}
        >
          {chartData.map((item, index) => (
            <option key={index} value={index}>
              ● {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 justify-center pb-0 p-6" id="tire-chart-wrapper" style={{ minHeight: '300px' }}>
        <div className="mx-auto aspect-square w-full max-w-[300px]" style={{ minHeight: '300px', minWidth: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={300} id="tire-responsive-container" key={chartKey}>
            <PieChart id="tire-pressure-pie-chart" key={`tire-pie-${chartKey}`} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
                </filter>
              </defs>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                strokeWidth={2}
                stroke="#fff"
                paddingAngle={2}
                id="tire-pie-element"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`tire-cell-${index}`} 
                    fill={entry.fill}
                    style={{
                      filter: activeIndex === index ? 'url(#shadow)' : 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  />
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
                            {activeData?.value.toLocaleString()}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-gray-500">
                            {activeData?.name}
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
