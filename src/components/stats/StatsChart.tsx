import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import { useState } from "react";

interface StatsChartProps {
  title: string;
  description: string;
  data: any[];
  type: 'bar' | 'pie';
  dataKey: string;
  colors?: string[];
  isTimeScale?: boolean;
}

export function StatsChart({ 
  title, 
  description, 
  data, 
  type, 
  dataKey, 
  colors = ['#0EA5E9', '#0284C7', '#0369A1', '#075985'],
  isTimeScale = false
}: StatsChartProps) {
  // Format data for time scale if needed
  const formattedData = isTimeScale ? formatTimeScaleData(data) : data;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Custom event handlers for hover
  const handleMouseEnter = (data: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Create data with custom fill colors based on hover state
  const coloredData = formattedData.map((entry, index) => ({
    ...entry,
    fill: activeIndex === index ? '#3b82f6' : '#0EA5E9'
  }));

  return (
    <Card className="w-full overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-sky-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="p-4 sm:p-6 border-b border-sky-100 dark:border-gray-700">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-400">{title}</CardTitle>
        <CardDescription className="text-sm text-sky-600 dark:text-sky-300">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-[300px] w-full">
          {formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {type === 'bar' ? (
                <BarChart 
                  data={coloredData} 
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  onMouseLeave={handleMouseLeave}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'var(--chart-text-color, #0c4a6e)', className: 'dark:fill-gray-300' }}
                    interval={isTimeScale ? 2 : 0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="#bae6fd"
                    className="dark:stroke-gray-600"
                    tickFormatter={isTimeScale ? (value) => formatMonthLabel(value) : undefined}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    width={30} 
                    tick={{ fill: 'var(--chart-text-color, #0c4a6e)', className: 'dark:fill-gray-300' }}
                    stroke="#bae6fd"
                    className="dark:stroke-gray-600"
                  />
                  <RechartsTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 border rounded-lg shadow-lg text-xs sm:text-sm border-sky-200 dark:border-gray-700">
                            <p className="font-semibold text-sky-900 dark:text-sky-400">{label}</p>
                            <p className="text-sky-700 dark:text-sky-300">
                              {payload[0].value} {dataKey !== 'count' ? dataKey : 'resets'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey={dataKey} 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={300}
                    fillOpacity={0.9}
                    onMouseEnter={handleMouseEnter}
                  >
                    {coloredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.fill}
                        className="transition-colors duration-200"
                        style={{
                          filter: activeIndex === index ? 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07))' : 'none',
                          transform: activeIndex === index ? 'translateY(-2px)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#0EA5E9"
                    dataKey={dataKey}
                  >
                    {formattedData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]}
                        className="transition-all duration-200 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 border rounded-lg shadow-lg text-xs sm:text-sm border-sky-200 dark:border-gray-700">
                            <p className="font-semibold text-sky-900 dark:text-sky-400">{data.name}</p>
                            <p className="text-sky-700 dark:text-sky-300">
                              {data[dataKey]} {dataKey !== 'count' ? dataKey : 'resets'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sky-600 dark:text-sky-400">
              No data available yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format month labels
function formatMonthLabel(value: string): string {
  // If the value already has a year and month format (e.g., "Jan 2023")
  if (/[A-Za-z]{3}\s\d{4}/.test(value)) {
    const [month, year] = value.split(' ');
    // Only show the year for January or the first month in the sequence
    return month === 'Jan' ? value : month;
  }
  return value;
}

// Helper function to ensure time scale data is properly sorted
function formatTimeScaleData(data: any[]): any[] {
  if (!data || data.length === 0) return [];
  
  // Check if data has month property which indicates it's time series data
  if (data[0].month) {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }
  
  return data;
}
