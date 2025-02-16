
import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Award, Target, Timer, Trophy } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { StatsCard } from '@/components/stats/StatsCard';
import { StatsChart } from '@/components/stats/StatsChart';
import { 
  getSuccessRate, 
  getTrendIndicator, 
  getWeeklyDistribution, 
  getStreakDistribution,
  getMonthsBetween
} from '@/utils/statistics';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const { toast } = useToast();

  const calculateStats = () => {
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

      // Enhanced streak analysis
      const avgDaysBetweenResets = totalResets > 1 
        ? Math.round(totalTimeBetween / (totalResets - 1) / (1000 * 60 * 60 * 24)) 
        : currentStreakDays;
      
      const longestStreak = Math.max(...streaks, 0);
      const medianStreak = streaks.length > 0 
        ? streaks.sort((a, b) => a - b)[Math.floor(streaks.length / 2)]
        : currentStreakDays;

      // Pattern detection
      const hasImprovedPattern = daysBetweenResets.length >= 3 && 
        daysBetweenResets.slice(-3).every((days, i, arr) => 
          i === 0 || days >= arr[i - 1]
        );

      // Monthly analysis with gap filling
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

      // Trend analysis
      const monthKeys = Object.keys(monthlyResets).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
      
      const lastMonth = monthlyResets[monthKeys[monthKeys.length - 1]] || 0;
      const previousMonth = monthlyResets[monthKeys[monthKeys.length - 2]] || 0;
      const twoMonthsAgo = monthlyResets[monthKeys[monthKeys.length - 3]] || 0;

      // Improvement calculations (inverted - fewer resets is better)
      const shortTermImprovement = previousMonth !== 0
        ? ((lastMonth - previousMonth) / previousMonth) * -100
        : (lastMonth === 0 ? 100 : -100);
      
      const longTermImprovement = twoMonthsAgo !== 0
        ? ((lastMonth - twoMonthsAgo) / twoMonthsAgo) * -100
        : (lastMonth === 0 ? 100 : -100);

      // Enhanced success metrics
      const firstReset = resetDates[0];
      const totalDays = firstReset 
        ? Math.max(Math.floor((now.getTime() - firstReset.getTime()) / (1000 * 60 * 60 * 24)), 1)
        : currentStreakDays || 1;
      
      const successRate = Math.min(((totalDays - totalResets) / totalDays) * 100, 100);
      
      // Consistency analysis
      const avgStreak = streaks.length > 0 
        ? streaks.reduce((a, b) => a + b, 0) / streaks.length 
        : currentStreakDays;
      
      const streakVariance = streaks.length > 0
        ? streaks.reduce((a, b) => a + Math.pow(b - avgStreak, 2), 0) / streaks.length
        : 0;
      
      const streakConsistency = avgStreak > 0 
        ? Math.max(0, Math.min(100, 100 - (Math.sqrt(streakVariance) / avgStreak * 50)))
        : 100;

      // Risk assessment
      const riskLevel = (() => {
        if (currentStreakDays < avgDaysBetweenResets / 2) return 'high';
        if (currentStreakDays < avgDaysBetweenResets) return 'medium';
        return 'low';
      })();

      // Overall score components
      const trendScore = Math.round(
        (Math.max(-100, Math.min(100, shortTermImprovement)) * 0.4) +
        (Math.max(-100, Math.min(100, longTermImprovement)) * 0.3) +
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
        progressIndicators: {
          isOnLongestStreak: currentStreakDays === longestStreak,
          isAboveAverage: currentStreakDays > avgDaysBetweenResets,
          isImproving: shortTermImprovement > 0,
          isConsistent: streakConsistency > 75
        }
      };
    });
  };

  const exportData = () => {
    try {
      const stats = calculateStats();
      const selectedStats = selectedHabitId === 'all' ? stats : stats.filter(s => s.name === habits.find(h => h.id === selectedHabitId)?.name);
      
      // Prepare CSV data
      const csvRows = [
        // Headers
        [
          'Habit Name',
          'Total Resets',
          'Average Days Between Resets',
          'Current Streak',
          'Longest Streak',
          'Success Rate (%)',
          'Consistency Score',
          'Trend Score'
        ].join(','),
        // Data rows
        ...selectedStats.map(stat => [
          `"${stat.name}"`,
          stat.totalResets,
          stat.avgDaysBetweenResets,
          stat.currentStreak,
          stat.longestStreak,
          stat.successRate,
          stat.streakConsistency,
          stat.trendScore
        ].join(','))
      ];

      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `habit-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Your habit data has been downloaded as a CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stats = calculateStats();
  const selectedHabit = selectedHabitId === 'all' ? null : habits.find(h => h.id === selectedHabitId);
  const selectedStats = selectedHabitId === 'all' 
    ? stats.reduce((acc, stat) => ({
        name: 'All Habits',
        totalResets: (acc?.totalResets || 0) + stat.totalResets,
        avgDaysBetweenResets: Math.round(stats.reduce((sum, s) => sum + s.avgDaysBetweenResets, 0) / stats.length),
        currentStreak: Math.max(...stats.map(s => s.currentStreak)),
        longestStreak: Math.max(...stats.map(s => s.longestStreak)),
        medianStreak: Math.round(stats.reduce((sum, s) => sum + s.medianStreak, 0) / stats.length),
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
        }, [] as { month: string, count: number }[]),
        shortTermImprovement: Math.round(stats.reduce((sum, s) => sum + s.shortTermImprovement, 0) / stats.length),
        longTermImprovement: Math.round(stats.reduce((sum, s) => sum + s.longTermImprovement, 0) / stats.length),
        successRate: Math.round(stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length),
        streakConsistency: Math.round(stats.reduce((sum, s) => sum + s.streakConsistency, 0) / stats.length),
        riskLevel: 'medium',
        hasImprovedPattern: stats.some(s => s.hasImprovedPattern),
        trendScore: Math.round(stats.reduce((sum, s) => sum + s.trendScore, 0) / stats.length),
        progressIndicators: {
          isOnLongestStreak: false,
          isAboveAverage: false,
          isImproving: stats.some(s => s.progressIndicators.isImproving),
          isConsistent: stats.some(s => s.progressIndicators.isConsistent)
        }
      }), stats[0])
    : stats.find(s => s.name === selectedHabit?.name);

  if (habits.length === 0) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-secondary to-white">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <p className="text-center text-gray-500">No habits found. Add some habits to see statistics.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const weeklyData = selectedHabit ? getWeeklyDistribution(selectedHabit.resets) : [];
  const streakDistributionData = selectedStats ? getStreakDistribution(selectedHabit, selectedStats) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 to-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <StatsHeader
          habits={habits}
          selectedHabitId={selectedHabitId}
          onHabitChange={setSelectedHabitId}
          onExport={exportData}
          onBack={() => navigate('/')}
        />

        {selectedStats && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <TooltipProvider>
                <StatsCard
                  title="Current Streak"
                  icon={<Trophy className="h-5 w-5 text-blue-600" />}
                  value={`${selectedStats.currentStreak} days`}
                  description={selectedStats.progressIndicators.isOnLongestStreak 
                    ? "🎉 Personal Best!" 
                    : `Record: ${selectedStats.longestStreak} days`}
                  className="hover:shadow-lg transition-shadow duration-200"
                />

                <StatsCard
                  title="Success Rate"
                  icon={<Target className="h-5 w-5 text-green-600" />}
                  value={`${getSuccessRate(selectedStats).rate}%`}
                  description={getSuccessRate(selectedStats).quality}
                  trend={getTrendIndicator(selectedStats)}
                  className="hover:shadow-lg transition-shadow duration-200"
                />

                <StatsCard
                  title="Consistency"
                  icon={<Timer className="h-5 w-5 text-purple-600" />}
                  value={`${selectedStats.streakConsistency}%`}
                  description={selectedStats.streakConsistency >= 75 
                    ? "Very Consistent" 
                    : selectedStats.streakConsistency >= 50 
                      ? "Moderately Consistent" 
                      : "Building Consistency"}
                  className="hover:shadow-lg transition-shadow duration-200"
                />

                <StatsCard
                  title="Overall Progress"
                  icon={<Award className="h-5 w-5 text-orange-600" />}
                  value={Math.max(0, Math.min(100, selectedStats.trendScore))}
                  description={selectedStats.trendScore >= 75 
                    ? "Excellent Progress" 
                    : selectedStats.trendScore >= 50 
                      ? "Good Progress" 
                      : "Getting Started"}
                  className="hover:shadow-lg transition-shadow duration-200"
                />
              </TooltipProvider>
            </div>

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

            <StatsChart
              title="Streak Distribution"
              description="Analysis of how long your streaks typically last"
              data={streakDistributionData}
              type="pie"
              dataKey="count"
            />
          </div>
        )}
      </div>
    </div>
  );
}
