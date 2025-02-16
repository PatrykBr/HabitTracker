import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BarChart as BarChartIcon, Award, ArrowUp, ArrowDown, Calendar, Trophy, Timer, Target, Sparkles, Flame, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');

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

  const getWeeklyDistribution = (resets: Date[]) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution = days.map(day => ({ name: day, count: 0 }));
    
    resets.forEach(date => {
      const dayIndex = new Date(date).getDay();
      distribution[dayIndex].count++;
    });
    
    return distribution;
  };

  const getSuccessRateOverTime = (monthlyResets: { month: string, count: number }[]) => {
    return monthlyResets.map(month => ({
      ...month,
      successRate: Math.max(0, 100 - (month.count * 20))
    }));
  };

  const getStreakDistribution = (stat: typeof selectedStats) => {
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

  const getTrendIndicator = (stat: typeof selectedStats) => {
    if (!stat) return null;
    const improvement = stat.shortTermImprovement;
    if (improvement > 20) return { icon: <TrendingUp className="h-4 w-4 text-green-600" />, text: "Significantly Fewer Resets", color: "text-green-600" };
    if (improvement > 0) return { icon: <ArrowUp className="h-4 w-4 text-emerald-600" />, text: "Decreasing Resets", color: "text-emerald-600" };
    if (improvement > -20) return { icon: <ArrowDown className="h-4 w-4 text-amber-600" />, text: "Slight Increase in Resets", color: "text-amber-600" };
    return { icon: <AlertTriangle className="h-4 w-4 text-red-600" />, text: "High Reset Frequency", color: "text-red-600" };
  };

  const getSuccessRate = (stat: typeof selectedStats) => {
    if (!stat) return { rate: 0, quality: "" };
    const rate = stat.successRate;
    if (rate >= 90) return { rate, quality: "Exceptional Control" };
    if (rate >= 75) return { rate, quality: "Strong Resistance" };
    if (rate >= 50) return { rate, quality: "Good Progress" };
    return { rate, quality: "Building Resistance" };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (habits.length === 0) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">No habits found. Add some habits to see statistics.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const weeklyData = selectedHabit ? getWeeklyDistribution(selectedHabit.resets) : [];
  const successRateData = selectedStats ? getSuccessRateOverTime(selectedStats.monthlyResets) : [];
  const streakDistributionData = selectedStats ? getStreakDistribution(selectedStats) : [];

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChartIcon className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Progress Analysis</h1>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a habit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                {habits.map(habit => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {selectedStats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-blue-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-blue-600" />
                          Current Streak
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-blue-600">
                            {selectedStats.currentStreak} days
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedStats.progressIndicators.isOnLongestStreak 
                              ? "🎉 Personal Best!" 
                              : `Record: ${selectedStats.longestStreak} days`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Days since your last reset. Longer streaks indicate stronger control.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-green-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-600" />
                          Success Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-green-600">
                            {getSuccessRate(selectedStats).rate}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {getSuccessRate(selectedStats).quality}
                          </p>
                          <div className="flex items-center gap-1">
                            {getTrendIndicator(selectedStats)?.icon}
                            <p className={`text-xs ${getTrendIndicator(selectedStats)?.color}`}>
                              {getTrendIndicator(selectedStats)?.text}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of days without resets. Higher is better.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-purple-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-purple-600" />
                          Consistency
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-purple-600">
                            {selectedStats.streakConsistency}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedStats.streakConsistency >= 75 
                              ? "Very Consistent" 
                              : selectedStats.streakConsistency >= 50 
                                ? "Moderately Consistent" 
                                : "Building Consistency"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How regular your streak lengths are. Higher consistency means more stable progress.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-orange-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-orange-600" />
                          Overall Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-orange-600">
                            {Math.max(0, Math.min(100, selectedStats.trendScore))}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedStats.trendScore >= 75 
                              ? "Excellent Progress" 
                              : selectedStats.trendScore >= 50 
                                ? "Good Progress" 
                                : "Getting Started"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Combined score based on all metrics. Higher scores indicate better overall progress.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Resets
                  </CardTitle>
                  <CardDescription>
                    Number of resets per month. Lower numbers indicate better control.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {selectedStats.monthlyResets.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={selectedStats.monthlyResets} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{label}</p>
                                    <p className="text-blue-600">
                                      {payload[0].value} resets
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#0EA5E9"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No data available yet. Keep tracking to see your progress!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Patterns
                  </CardTitle>
                  <CardDescription>
                    Shows which days of the week tend to be more challenging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {weeklyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{label}</p>
                                    <p className="text-blue-600">
                                      {payload[0].value} resets
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" fill="#8884d8">
                            {weeklyData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No data available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5" />
                    Streak Distribution
                  </CardTitle>
                  <CardDescription>
                    Analysis of how long your streaks typically last
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {streakDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <Pie
                            data={streakDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {streakDistributionData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{data.name}</p>
                                    <p className="text-blue-600">
                                      {data.count} streak{data.count !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No streak data available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Insights & Tips
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  selectedStats.riskLevel === 'low' ? 'bg-green-50 border border-green-200' :
                  selectedStats.riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Current Status
                  </h3>
                  <p className="text-sm">
                    {selectedStats.riskLevel === 'low' 
                      ? "You're doing great! Your current streak shows strong control." 
                      : selectedStats.riskLevel === 'medium'
                        ? "Stay focused - you're in a moderate risk period. Use your proven strategies."
                        : "This is a higher risk period. Consider what strategies worked well during your longer streaks."}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <h3 className="font-semibold mb-2">Pattern Analysis</h3>
                  <div className="space-y-2 text-sm">
                    {weeklyData.length > 0 && (
                      <p>
                        {weeklyData.reduce((max, current) => current.count > max.count ? current : max).name}
                        {" tends to be your most challenging day."}
                      </p>
                    )}
                    {selectedStats.streakConsistency > 75 && (
                      <p>Your consistency is excellent - keep maintaining your current approach!</p>
                    )}
                    {selectedStats.currentStreak > selectedStats.avgDaysBetweenResets && (
                      <p>You're currently exceeding your average streak length - great work!</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Select a habit to view detailed statistics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
