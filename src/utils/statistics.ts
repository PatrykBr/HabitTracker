import { TrendingDown, ArrowDown, AlertTriangle, TrendingUp } from "lucide-react";
import { startOfDay } from "date-fns";

export const getMonthsBetween = (startDate: Date, endDate: Date) => {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return months;
};

export const getWeeklyDistribution = (resets: Date[]) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const distribution = days.map(day => ({ name: day, count: 0 }));
  
  if (!resets || resets.length === 0) return [];

  resets.forEach(date => {
    const alignedDate = startOfDay(new Date(date));
    const dayIndex = alignedDate.getDay();
    distribution[dayIndex].count++;
  });
  
  return distribution;
};

export const getStreakDistribution = (selectedHabit: any, stat: any) => {
  if (!stat) return [];
  
  const ranges = [
    { name: '1-7 days', min: 1, max: 7, count: 0 },
    { name: '8-14 days', min: 8, max: 14, count: 0 },
    { name: '15-30 days', min: 15, max: 30, count: 0 },
    { name: '31+ days', min: 31, max: Infinity, count: 0 }
  ];

  let streaks: number[] = [];
  
  const dates = selectedHabit ? selectedHabit.resets : stat.resetDates;
  
  if (dates && dates.length > 0) {
    const sortedResets = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    for (let i = 0; i < sortedResets.length - 1; i++) {
      const streakDays = Math.floor(
        (new Date(sortedResets[i + 1]).getTime() - new Date(sortedResets[i]).getTime()) / (1000 * 60 * 60 * 24)
      );
      streaks.push(streakDays);
    }
    streaks.push(stat.currentStreak);
  }

  streaks.forEach(streakDays => {
    const range = ranges.find(r => streakDays >= r.min && streakDays <= r.max);
    if (range) {
      range.count++;
    }
  });

  return ranges.filter(range => range.count > 0);
};

export const getTrendIndicator = (stat: any) => {
  if (!stat) return null;

  const monthlyResets = stat.monthlyResets;
  if (monthlyResets.length < 2) return null;

  const currentMonth = monthlyResets[monthlyResets.length - 1].count;
  const previousMonth = monthlyResets[monthlyResets.length - 2].count;
  const improvement = ((previousMonth - currentMonth) / previousMonth) * 100;

  if (improvement >= 50) {
    return { 
      icon: 'trending-down', 
      text: "Excellent Progress! Resets down by 50%+", 
      color: "text-green-600",
      emoji: "🌟"
    };
  }
  if (improvement >= 25) {
    return { 
      icon: 'arrow-down', 
      text: "Good Progress! Resets decreasing", 
      color: "text-emerald-600",
      emoji: "💪"
    };
  }
  if (improvement >= 0) {
    return { 
      icon: 'trending-down', 
      text: "Slight Improvement", 
      color: "text-blue-600",
      emoji: "👍"
    };
  }
  if (improvement >= -25) {
    return { 
      icon: 'alert-triangle', 
      text: "Slight Increase in Resets", 
      color: "text-amber-600",
      emoji: "⚠️"
    };
  }
  return { 
    icon: 'alert-triangle', 
    text: "Significant Increase in Resets", 
    color: "text-red-600",
    emoji: "🚨"
  };
};

export const getSuccessRate = (stat: any) => {
  if (!stat) return { rate: 0, quality: "", emoji: "" };
  const rate = stat.successRate;

  if (rate >= 90) {
    return { 
      rate, 
      quality: "Outstanding Control",
      emoji: "🏆",
      color: "text-green-600"
    };
  }
  if (rate >= 75) {
    return { 
      rate, 
      quality: "Strong Resistance",
      emoji: "💪",
      color: "text-emerald-600"
    };
  }
  if (rate >= 50) {
    return { 
      rate, 
      quality: "Good Progress",
      emoji: "👍",
      color: "text-blue-600"
    };
  }
  return { 
    rate, 
    quality: "Building Strength",
    emoji: "🌱",
    color: "text-amber-600"
  };
};

export const calculateTimeUntilMilestone = (currentStreak: number) => {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find(m => m > currentStreak);
  
  if (!nextMilestone) {
    return {
      days: 0,
      milestone: currentStreak,
      message: "You've reached all major milestones! 🎉"
    };
  }

  const daysLeft = nextMilestone - currentStreak;
  return {
    days: daysLeft,
    milestone: nextMilestone,
    message: `${daysLeft} days until ${nextMilestone}-day milestone`
  };
};

export const getMotivationalMessage = (stats: any) => {
  if (!stats) return "";
  
  const { currentStreak, longestStreak, successRate } = stats;
  
  if (currentStreak === longestStreak && currentStreak > 30) {
    return "🌟 You're setting a new personal record! Keep going!";
  }
  if (successRate >= 90) {
    return "💫 Exceptional control! You're mastering this!";
  }
  if (currentStreak >= 7) {
    return "🔥 Solid streak! Each day builds your strength!";
  }
  if (successRate >= 75) {
    return "💪 Strong progress! You're building great habits!";
  }
  return "🌱 Every day is a new opportunity for growth!";
};

export const getCommonResetTimes = (resets: Date[]) => {
  if (!resets || resets.length === 0) return [];

  const timeMap = new Map<string, number>();
  
  resets.forEach(reset => {
    const date = new Date(reset);
    // Group by hour
    const timeKey = date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      hour12: true 
    });
    timeMap.set(timeKey, (timeMap.get(timeKey) || 0) + 1);
  });

  // Convert to array and sort by count
  const sortedTimes = Array.from(timeMap.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5 times

  return sortedTimes;
};
