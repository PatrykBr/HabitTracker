
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
  
  resets.forEach(date => {
    const dayIndex = new Date(date).getDay();
    distribution[dayIndex].count++;
  });
  
  return distribution;
};

export const getSuccessRateOverTime = (monthlyResets: { month: string, count: number }[]) => {
  return monthlyResets.map(month => ({
    ...month,
    successRate: Math.max(0, 100 - (month.count * 20))
  }));
};

export const getStreakDistribution = (selectedHabit: any, stat: any) => {
  if (!stat || !selectedHabit) return [];
  
  const ranges = [
    { name: '1-7 days', min: 1, max: 7, count: 0 },
    { name: '8-14 days', min: 8, max: 14, count: 0 },
    { name: '15-30 days', min: 15, max: 30, count: 0 },
    { name: '31+ days', min: 31, max: Infinity, count: 0 }
  ];

  const sortedResets = [...selectedHabit.resets].sort((a, b) => a.getTime() - b.getTime());

  const streaks: number[] = [];
  for (let i = 0; i < sortedResets.length - 1; i++) {
    const streakDays = Math.floor(
      (sortedResets[i + 1].getTime() - sortedResets[i].getTime()) / (1000 * 60 * 60 * 24)
    );
    streaks.push(streakDays);
  }

  streaks.push(stat.currentStreak);

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
  const improvement = stat.shortTermImprovement;
  if (improvement > 20) return { icon: 'trending-up', text: "Significantly Fewer Resets", color: "text-green-600" };
  if (improvement > 0) return { icon: 'arrow-up', text: "Decreasing Resets", color: "text-emerald-600" };
  if (improvement > -20) return { icon: 'arrow-down', text: "Slight Increase in Resets", color: "text-amber-600" };
  return { icon: 'alert-triangle', text: "High Reset Frequency", color: "text-red-600" };
};

export const getSuccessRate = (stat: any) => {
  if (!stat) return { rate: 0, quality: "" };
  const rate = stat.successRate;
  if (rate >= 90) return { rate, quality: "Exceptional Control" };
  if (rate >= 75) return { rate, quality: "Strong Resistance" };
  if (rate >= 50) return { rate, quality: "Good Progress" };
  return { rate, quality: "Building Resistance" };
};
