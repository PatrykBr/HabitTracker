import { HabitType } from "@/hooks/use-habits";
import { 
  getSuccessRate, 
  getTrendIndicator, 
  getWeeklyDistribution, 
  getStreakDistribution,
  getMonthsBetween
} from '@/utils/statistics';

export type StatType = {
  name: string;
  totalResets: number;
  avgDaysBetweenResets: number;
  currentStreak: number;
  longestStreak: number;
  medianStreak: number;
  monthlyResets: { month: string; count: number }[];
  shortTermImprovement: number;
  longTermImprovement: number;
  successRate: number;
  streakConsistency: number;
  riskLevel: 'high' | 'medium' | 'low';
  hasImprovedPattern: boolean;
  trendScore: number;
  resetDates: Date[];
  progressIndicators: {
    isOnLongestStreak: boolean;
    isAboveAverage: boolean;
    isImproving: boolean;
    isConsistent: boolean;
  };
};

export const calculateStats = (habits: HabitType[]): StatType[] => {
  const now = new Date();
  
  return habits.map(habit => {
    const resetDates = habit.resets.map(date => new Date(date));
    resetDates.sort((a, b) => a.getTime() - b.getTime());
    const totalResets = resetDates.length;

    // Current streak calculation
    const currentStreakDays = Math.floor(
      (now.getTime() - new Date(habit.lastReset).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate all streaks and patterns
    const streaks: number[] = [];
    const daysBetweenResets: number[] = [];
    let totalTimeBetween = 0;

    if (resetDates.length >= 2) {
      for (let i = 0; i < resetDates.length - 1; i++) {
        const timeBetween = resetDates[i + 1].getTime() - resetDates[i].getTime();
        const streakDays = Math.floor(timeBetween / (1000 * 60 * 60 * 24));
        totalTimeBetween += timeBetween;
        streaks.push(streakDays);
        daysBetweenResets.push(streakDays);
      }
    }
    streaks.push(currentStreakDays);

    const avgDaysBetweenResets = totalResets > 1 
      ? Math.round(totalTimeBetween / (totalResets - 1) / (1000 * 60 * 60 * 24)) 
      : currentStreakDays;
    
    const longestStreak = Math.max(...streaks, 0);
    const medianStreak = streaks.length > 0 
      ? streaks.sort((a, b) => a - b)[Math.floor(streaks.length / 2)]
      : currentStreakDays;

    const hasImprovedPattern = daysBetweenResets.length >= 3 && 
      daysBetweenResets.slice(-3).every((days, i, arr) => 
        i === 0 || days >= arr[i - 1]
      );

    // Monthly analysis
    const monthlyResets: { [key: string]: number } = {};
    if (resetDates.length > 0) {
      const firstDate = new Date(Math.min(...resetDates.map(d => d.getTime())));
      const allMonths = getMonthsBetween(firstDate, now);
      allMonths.forEach(month => {
        monthlyResets[month] = 0;
      });
      resetDates.forEach(date => {
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyResets[monthYear] = (monthlyResets[monthYear] || 0) + 1;
      });
    }

    const monthKeys = Object.keys(monthlyResets).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    const lastMonth = monthlyResets[monthKeys[monthKeys.length - 1]] || 0;
    const previousMonth = monthlyResets[monthKeys[monthKeys.length - 2]] || 0;
    const twoMonthsAgo = monthlyResets[monthKeys[monthKeys.length - 3]] || 0;

    const shortTermImprovement = previousMonth !== 0
      ? ((lastMonth - previousMonth) / previousMonth) * -100
      : (lastMonth === 0 ? 100 : -100);
    
    const longTermImprovement = twoMonthsAgo !== 0
      ? ((lastMonth - twoMonthsAgo) / twoMonthsAgo) * -100
      : (lastMonth === 0 ? 100 : -100);

    const firstReset = resetDates[0];
    const totalDays = firstReset 
      ? Math.max(Math.floor((now.getTime() - firstReset.getTime()) / (1000 * 60 * 60 * 24)), 1)
      : currentStreakDays || 1;
    
    const successRate = Math.min(((totalDays - totalResets) / totalDays) * 100, 100);
    
    const avgStreak = streaks.length > 0 
      ? streaks.reduce((a, b) => a + b, 0) / streaks.length 
      : currentStreakDays;
    
    const streakVariance = streaks.length > 0
      ? streaks.reduce((a, b) => a + Math.pow(b - avgStreak, 2), 0) / streaks.length
      : 0;
    
    const streakConsistency = avgStreak > 0 
      ? Math.max(0, Math.min(100, 100 - (Math.sqrt(streakVariance) / avgStreak * 50)))
      : 100;

    const riskLevel = (() => {
      if (currentStreakDays < avgDaysBetweenResets / 2) return 'high';
      if (currentStreakDays < avgDaysBetweenResets) return 'medium';
      return 'low';
    })();

    // Normalize improvement scores to be between 0 and 100
    const normalizedShortTerm = ((shortTermImprovement + 100) / 200) * 100;
    const normalizedLongTerm = ((longTermImprovement + 100) / 200) * 100;

    const trendScore = Math.round(
      (normalizedShortTerm * 0.4) +
      (normalizedLongTerm * 0.3) +
      (successRate * 0.2) +
      (streakConsistency * 0.1)
    );

    return {
      name: habit.name,
      totalResets,
      avgDaysBetweenResets,
      currentStreak: currentStreakDays,
      longestStreak,
      medianStreak,
      monthlyResets: Object.entries(monthlyResets).map(([month, count]) => ({
        month,
        count
      })),
      shortTermImprovement,
      longTermImprovement,
      successRate: Math.round(Math.max(0, successRate)),
      streakConsistency: Math.round(streakConsistency),
      riskLevel,
      hasImprovedPattern,
      trendScore,
      resetDates,
      progressIndicators: {
        isOnLongestStreak: currentStreakDays === longestStreak,
        isAboveAverage: currentStreakDays > avgDaysBetweenResets,
        isImproving: shortTermImprovement > 0,
        isConsistent: streakConsistency > 75
      }
    };
  });
};

export const calculateCombinedStats = (stats: StatType[]): StatType => {
  // If there's only one habit, return its stats directly
  if (stats.length === 1) {
    return {
      ...stats[0],
      name: 'All Habits'
    };
  }

  return stats.reduce((acc, stat) => ({
    name: 'All Habits',
    totalResets: (acc?.totalResets || 0) + stat.totalResets,
    avgDaysBetweenResets: Math.round(stats.reduce((sum, s) => sum + s.avgDaysBetweenResets, 0) / stats.length),
    currentStreak: Math.max(...stats.map(s => s.currentStreak)),
    longestStreak: Math.max(...stats.map(s => s.longestStreak)),
    medianStreak: Math.round(stats.reduce((sum, s) => sum + s.medianStreak, 0) / stats.length),
    resetDates: stats.flatMap(s => s.resetDates),
    monthlyResets: stats.reduce((acc, stat) => {
      stat.monthlyResets.forEach(monthly => {
        const existing = acc.find(m => m.month === monthly.month);
        if (existing) {
          existing.count += monthly.count;
        } else {
          acc.push({ ...monthly });
        }
      });
      return acc;
    }, [] as { month: string; count: number }[]),
    shortTermImprovement: Math.round(stats.reduce((sum, s) => sum + s.shortTermImprovement, 0) / stats.length),
    longTermImprovement: Math.round(stats.reduce((sum, s) => sum + s.longTermImprovement, 0) / stats.length),
    successRate: Math.round(stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length),
    streakConsistency: Math.round(stats.reduce((sum, s) => sum + s.streakConsistency, 0) / stats.length),
    riskLevel: 'medium' as const,
    hasImprovedPattern: stats.some(s => s.hasImprovedPattern),
    trendScore: Math.round(stats.reduce((sum, s) => sum + s.trendScore, 0) / stats.length),
    progressIndicators: {
      isOnLongestStreak: false,
      isAboveAverage: false,
      isImproving: stats.some(s => s.progressIndicators.isImproving),
      isConsistent: stats.some(s => s.progressIndicators.isConsistent)
    }
  }), stats[0]);
};
