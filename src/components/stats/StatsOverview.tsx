
import { Trophy, Target, Timer, Award } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StatsCard } from "@/components/stats/StatsCard";
import { StatType } from "@/utils/statsCalculator";
import { getSuccessRate, getTrendIndicator } from "@/utils/statistics";

interface StatsOverviewProps {
  stats: StatType;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <TooltipProvider>
        <StatsCard
          title="Current Streak"
          icon={<Trophy className="h-5 w-5 text-blue-600" />}
          value={`${stats.currentStreak} days`}
          description={stats.progressIndicators.isOnLongestStreak 
            ? "🎉 Personal Best!" 
            : `Record: ${stats.longestStreak} days`}
          className="hover:shadow-lg transition-shadow duration-200"
        />

        <StatsCard
          title="Success Rate"
          icon={<Target className="h-5 w-5 text-green-600" />}
          value={`${getSuccessRate(stats).rate}%`}
          description={getSuccessRate(stats).quality}
          trend={getTrendIndicator(stats)}
          className="hover:shadow-lg transition-shadow duration-200"
        />

        <StatsCard
          title="Consistency"
          icon={<Timer className="h-5 w-5 text-purple-600" />}
          value={`${stats.streakConsistency}%`}
          description={stats.streakConsistency >= 75 
            ? "Very Consistent" 
            : stats.streakConsistency >= 50 
              ? "Moderately Consistent" 
              : "Building Consistency"}
          className="hover:shadow-lg transition-shadow duration-200"
        />

        <StatsCard
          title="Overall Progress"
          icon={<Award className="h-5 w-5 text-orange-600" />}
          value={Math.max(0, Math.min(100, stats.trendScore))}
          description={stats.trendScore >= 75 
            ? "Excellent Progress" 
            : stats.trendScore >= 50 
              ? "Good Progress" 
              : "Getting Started"}
          className="hover:shadow-lg transition-shadow duration-200"
        />
      </TooltipProvider>
    </div>
  );
}
