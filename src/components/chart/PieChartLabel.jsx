import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { browser: "chrome", visitors: 275, fill: "#3b82f6" },
  { browser: "safari", visitors: 200, fill: "#06b6d4" },
  { browser: "firefox", visitors: 187, fill: "#8b5cf6" },
  { browser: "edge", visitors: 173, fill: "#f59e0b" },
  { browser: "other", visitors: 90, fill: "#6366f1" },
]

const chartConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome" },
  safari: { label: "Safari" },
  firefox: { label: "Firefox" },
  edge: { label: "Edge" },
  other: { label: "Other" },
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">
          {chartConfig[payload[0].name]?.label || payload[0].name}
        </p>
        <p className="text-sm text-gray-600">
          Visitors: {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

const renderLabel = (entry) => {
  return `${chartConfig[entry.browser]?.label || entry.browser}: ${entry.visitors}`
}

export default function ChartPieLabel() {
  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-1.5 p-6 pb-0">
        <h3 className="font-semibold text-2xl tracking-tight">Pie Chart - Label</h3>
        <p className="text-sm text-gray-500">January - June 2024</p>
      </div>
      
      <div className="flex-1 p-6 pb-0">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              cx="50%"
              cy="50%"
              label={renderLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-col gap-2 text-sm p-6 pt-6">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-gray-500 leading-none">
          Showing total visitors for the last 6 months
        </div>
      </div>
    </div>
  )
}