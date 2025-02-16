
import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BarChart, Award, ArrowUp, ArrowDown, Calendar, Trophy, Timer, Target, Sparkles, Flame, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();

  const calculateStats = () => {
    const now = new Date();
    
    const getMonthsBetween = (startDate: Date, endDate: Date) => {
      const months: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        months.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return months;
    };

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

  const stats = calculateStats();

  // Enhanced insights
  const bestStreak = Math.max(...stats.map(s => s.currentStreak), 0);
  const bestStreakHabit = stats.find(s => s.currentStreak === bestStreak);

  const mostConsistent = stats.reduce((prev, current) => 
    (current.streakConsistency > prev.streakConsistency) ? current : prev
  , stats[0] || { name: '', streakConsistency: 0 });

  const overallImprovement = stats.length > 0
    ? stats.reduce((sum, stat) => sum + stat.shortTermImprovement, 0) / stats.length
    : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Statistics & Insights</h1>
          </div>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Habits
          </Button>
        </div>

        {/* Top Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`bg-gradient-to-br ${bestStreak > 30 ? 'from-green-50' : 'from-blue-50'} to-white`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className={`h-5 w-5 ${bestStreak > 30 ? 'text-green-600' : 'text-blue-600'}`} />
                Best Current Streak
              </CardTitle>
              <CardDescription>
                {bestStreakHabit?.name || 'No habits yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${bestStreak > 30 ? 'text-green-600' : 'text-blue-600'}`}>
                {bestStreak} days
                {bestStreakHabit?.progressIndicators.isOnLongestStreak && 
                  <span className="text-sm ml-2">(Personal Best!)</span>
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Most Consistent
              </CardTitle>
              <CardDescription>
                {mostConsistent.name || 'No habits yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">
                {mostConsistent.streakConsistency}% 
                <span className="text-sm ml-2">stable</span>
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${overallImprovement > 0 ? 'from-green-50' : 'from-red-50'} to-white`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {overallImprovement > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Overall Trend
              </CardTitle>
              <CardDescription>Last 3 months analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${overallImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(Math.round(overallImprovement))}%
                {overallImprovement > 0 ? ' better' : ' more resets'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Over Time */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>Monthly reset patterns and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    type="category"
                    allowDuplicatedCategory={false}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {stats.map((habit) => (
                    <Area
                      key={habit.name}
                      type="monotone"
                      data={habit.monthlyResets}
                      name={habit.name}
                      dataKey="count"
                      fill={`#${Math.floor(Math.random()*16777215).toString(16)}40`}
                      stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Analysis</CardTitle>
            <CardDescription>Detailed metrics for each habit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Habit</th>
                    <th className="px-6 py-3">Current Streak</th>
                    <th className="px-6 py-3">Success Rate</th>
                    <th className="px-6 py-3">Consistency</th>
                    <th className="px-6 py-3">Risk Level</th>
                    <th className="px-6 py-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.name} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          {stat.name}
                          {stat.hasImprovedPattern && (
                            <Flame className="h-4 w-4 text-orange-500" title="Improving pattern detected!" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {stat.currentStreak} days
                          {stat.progressIndicators.isOnLongestStreak && (
                            <Trophy className="h-4 w-4 text-yellow-500" title="Personal best!" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{stat.successRate}%</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {stat.streakConsistency}%
                          {stat.progressIndicators.isConsistent && (
                            <Timer className="h-4 w-4 text-blue-500" title="Highly consistent!" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${stat.riskLevel === 'low' ? 'bg-green-100 text-green-800' : 
                            stat.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {stat.riskLevel.charAt(0).toUpperCase() + stat.riskLevel.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`${stat.shortTermImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.shortTermImprovement > 0 ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </span>
                          {Math.abs(Math.round(stat.shortTermImprovement))}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
