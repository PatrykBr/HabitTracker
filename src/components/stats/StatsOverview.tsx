
import { Trophy, Target, Timer, Award, Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StatsCard } from "@/components/stats/StatsCard";
import { StatType } from "@/utils/statsCalculator";
import { getSuccessRate, getTrendIndicator } from "@/utils/statistics";

interface StatsOverviewProps {
  stats: StatType;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const successRate = getSuccessRate(stats);
  const trend = getTrendIndicator(stats);
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-sky-900">Your Progress Journey</h2>
        <p className="text-sky-700 text-sm sm:text-base">
          {stats.currentStreak >= 7 
            ? "🌟 Amazing progress! Keep building on your success!"
            : stats.currentStreak >= 3
            ? "💪 You're building momentum! Stay strong!"
            : "🌱 Every day is a new opportunity. You've got this!"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <TooltipProvider>
          <StatsCard
            title="Current Streak"
            icon={<Trophy className="h-5 w-5 text-amber-500" />}
            value={`${stats.currentStreak} days`}
            description={stats.progressIndicators.isOnLongestStreak 
              ? "🏆 Personal Best!" 
              : `Record: ${stats.longestStreak} days`}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              stats.currentStreak >= stats.longestStreak 
                ? 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50' 
                : 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50'
            }`}
            progressPercentage={Math.min(100, (stats.currentStreak / stats.longestStreak) * 100)}
          />

          <StatsCard
            title="Success Rate"
            icon={<Target className="h-5 w-5 text-emerald-500" />}
            value={`${successRate.rate}%`}
            description={successRate.quality}
            trend={trend}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              successRate.rate >= 75 
                ? 'border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50'
                : successRate.rate >= 50
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50'
                : 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50'
            }`}
            progressPercentage={successRate.rate}
          />

          <StatsCard
            title="Consistency"
            icon={<Timer className="h-5 w-5 text-purple-500" />}
            value={`${stats.streakConsistency}%`}
            description={stats.streakConsistency >= 75 
              ? "Very Consistent 🌟" 
              : stats.streakConsistency >= 50 
                ? "Building Consistency 💪" 
                : "Getting Started 🌱"}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              stats.streakConsistency >= 75 
                ? 'border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50'
                : stats.streakConsistency >= 50
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50'
                : 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50'
            }`}
            progressPercentage={stats.streakConsistency}
          />

          <StatsCard
            title="Overall Progress"
            icon={<Sparkles className="h-5 w-5 text-cyan-500" />}
            value={`${Math.max(0, Math.min(100, stats.trendScore))}%`}
            description={stats.trendScore >= 75 
              ? "Exceptional Growth 🚀" 
              : stats.trendScore >= 50 
                ? "Making Progress ⭐" 
                : "Taking Steps Forward 🌱"}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              stats.trendScore >= 75 
                ? 'border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-cyan-100/50'
                : stats.trendScore >= 50
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50'
                : 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50'
            }`}
            progressPercentage={stats.trendScore}
          />
        </TooltipProvider>
      </div>
    </div>
  );
}
