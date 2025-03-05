import { StatsChart } from "@/components/stats/StatsChart";
import { StatType } from "@/utils/statsCalculator";
import { HabitType } from "@/hooks/use-habits";
import { TimeDistribution } from "@/components/stats/TimeDistribution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface StatsChartsProps {
  selectedStats: StatType;
  selectedHabit: HabitType | null;
  weeklyData: { name: string; count: number; }[];
  streakDistributionData: { name: string; count: number; }[];
  commonTimes: { time: string; count: number }[];
}

export function StatsCharts({ 
  selectedStats, 
  weeklyData,
  streakDistributionData,
  commonTimes
}: StatsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 text-sm text-sky-700 dark:text-sky-300">
        <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
        <p>
          <span className="font-medium">Chart Guide:</span> These charts help identify patterns in your habit tracking data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StatsChart
          title="Monthly Activity"
          description="Number of resets per month. Identify trends over time."
          data={selectedStats.monthlyResets.map(item => ({
            name: item.month,
            count: item.count
          }))}
          type="bar"
          dataKey="count"
          colors={['#f87171', '#ef4444', '#dc2626']}
          isTimeScale={true}
        />

        <StatsChart
          title="Weekly Patterns"
          description="Days of the week with the most resets. Identify your challenging days."
          data={weeklyData}
          type="bar"
          dataKey="count"
          colors={['#f87171', '#ef4444', '#dc2626']}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StatsChart
          title="Streak Length Distribution"
          description="How long your streaks typically last"
          data={streakDistributionData}
          type="pie"
          dataKey="count"
          colors={['#0EA5E9', '#0284C7', '#0369A1', '#075985', '#0C4A6E']}
        />

        <TimeDistribution 
          times={commonTimes} 
          title="Time Patterns"
          description="Times of day when resets typically occur"
        />
      </div>
    </div>
  );
}
