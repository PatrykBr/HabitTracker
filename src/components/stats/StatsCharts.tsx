
import { StatsChart } from "@/components/stats/StatsChart";
import { StatType } from "@/utils/statsCalculator";
import { HabitType } from "@/hooks/use-habits";
import { TimeDistribution } from "@/components/stats/TimeDistribution";

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StatsChart
          title="Monthly Resets"
          description="Number of resets per month. Lower numbers indicate better control."
          data={selectedStats.monthlyResets}
          type="bar"
          dataKey="count"
        />

        <StatsChart
          title="Weekly Patterns"
          description="Shows which days of the week tend to be more challenging"
          data={weeklyData}
          type="bar"
          dataKey="count"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StatsChart
          title="Streak Distribution"
          description="Analysis of how long your streaks typically last"
          data={streakDistributionData}
          type="pie"
          dataKey="count"
        />

        <TimeDistribution times={commonTimes} />
      </div>
    </div>
  );
}
