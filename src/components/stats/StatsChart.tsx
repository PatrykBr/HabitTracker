
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatsChartProps {
  title: string;
  description: string;
  data: any[];
  type: 'bar' | 'pie';
  dataKey: string;
  colors?: string[];
}

export function StatsChart({ title, description, data, type, dataKey, colors = ['#0EA5E9', '#22C55E', '#F59E0B', '#EF4444'] }: StatsChartProps) {
  return (
    <Card className="w-full overflow-hidden bg-white/50 backdrop-blur-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-4 sm:p-6 border-b border-gray-100">
        <CardTitle className="text-lg text-gray-700">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-[300px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {type === 'bar' ? (
                <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} width={30} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border rounded-lg shadow-lg text-xs sm:text-sm">
                            <p className="font-semibold">{label}</p>
                            <p className="text-blue-600">
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
                    fill="#0EA5E9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dataKey}
                  >
                    {data.map((_, index) => (
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
                          <div className="bg-white p-2 border rounded-lg shadow-lg text-xs sm:text-sm">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-blue-600">
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
            <div className="h-full flex items-center justify-center text-gray-500">
              No data available yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
