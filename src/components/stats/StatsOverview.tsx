import { Trophy, Target, AlertCircle, Sparkles } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
        <h2 className="text-2xl font-bold text-sky-900 dark:text-sky-400">Your Statistics</h2>
        <p className="text-sky-700 dark:text-sky-300 text-sm sm:text-base">
          Track your progress and identify patterns in your habit data
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
                ? 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20' 
                : 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/30 dark:to-sky-900/20'
            }`}
            progressPercentage={Math.min(100, (stats.currentStreak / stats.longestStreak) * 100)}
            tooltipContent="Days since your last reset"
          />

          <StatsCard
            title="Total Resets"
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            value={`${stats.totalResets}`}
            description={stats.totalResets === 0 
              ? "No resets recorded 🏆" 
              : stats.totalResets <= 3 
                ? "Few resets 🌟" 
                : stats.totalResets <= 10 
                  ? "Building consistency 💪" 
                  : "Tracking progress 🌱"}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              stats.totalResets === 0 
                ? 'border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20'
                : stats.totalResets <= 3
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/30 dark:to-sky-900/20'
                : 'border-l-red-500 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20'
            }`}
            progressPercentage={Math.max(0, 100 - (stats.totalResets * 10))}
            tooltipContent="Number of times your habit has been reset"
            invertProgress={true}
          />

          <StatsCard
            title="Success Rate"
            icon={<Target className="h-5 w-5 text-emerald-500" />}
            value={`${successRate.rate}%`}
            description={successRate.quality}
            trend={trend}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              successRate.rate >= 75 
                ? 'border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20'
                : successRate.rate >= 50
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/30 dark:to-sky-900/20'
                : 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20'
            }`}
            progressPercentage={successRate.rate}
            tooltipContent="Percentage of days you've maintained your streak"
          />

          <StatsCard
            title="Longest Streak"
            icon={<Sparkles className="h-5 w-5 text-cyan-500" />}
            value={`${stats.longestStreak} days`}
            description={stats.longestStreak >= 30 
              ? "Exceptional! 🚀" 
              : stats.longestStreak >= 14 
                ? "Great progress! ⭐" 
                : "Building momentum 🌱"}
            className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
              stats.longestStreak >= 30 
                ? 'border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20'
                : stats.longestStreak >= 14
                ? 'border-l-sky-500 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/30 dark:to-sky-900/20'
                : 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20'
            }`}
            progressPercentage={Math.min(100, (stats.longestStreak / 30) * 100)}
            tooltipContent="Your record for the longest streak"
          />
        </TooltipProvider>
      </div>
    </div>
  );
}
