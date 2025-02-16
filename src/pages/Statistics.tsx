import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  BarChart as RechartsBarChart,
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
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || '');

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
  const selectedStat = stats.find(s => s.name === habits.find(h => h.id === selectedHabitId)?.name);
  
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
      successRate: Math.max(0, 100 - (month.count * 20)) // Simple conversion of resets to success rate
    }));
  };

  const getStreakDistribution = (stat: typeof selectedStat) => {
    if (!stat) return [];
    
    const ranges = [
      { name: '1-7 days', min: 1, max: 7, count: 0 },
      { name: '8-14 days', min: 8, max: 14, count: 0 },
      { name: '15-30 days', min: 15, max: 30, count: 0 },
      { name: '31+ days', min: 31, max: Infinity, count: 0 }
    ];

    const streakDay = stat.currentStreak;
    ranges.forEach(range => {
      if (streakDay >= range.min && streakDay <= range.max) {
        range.count++;
      }
    });

    return ranges;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Habit Analysis</h1>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a habit" />
              </SelectTrigger>
              <SelectContent>
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

        {selectedStat ? (
          <>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedStat.currentStreak} days
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStat.progressIndicators.isOnLongestStreak && "Personal Best!"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedStat.successRate}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Overall completion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-purple-600" />
                    Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {selectedStat.streakConsistency}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Streak stability score
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.abs(Math.round(selectedStat.shortTermImprovement))}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStat.shortTermImprovement > 0 ? 'Improvement' : 'Decline'} vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Over Time */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Progress Over Time</CardTitle>
                  <CardDescription>Monthly success rate trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSuccessRateOverTime(selectedStat.monthlyResets)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line 
                          type="monotone" 
                          dataKey="successRate" 
                          stroke="#8884d8" 
                          name="Success Rate"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Pattern</CardTitle>
                  <CardDescription>Reset distribution by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getWeeklyDistribution(habits.find(h => h.id === selectedHabitId)?.resets || [])}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#8884d8">
                          {getWeeklyDistribution(habits.find(h => h.id === selectedHabitId)?.resets || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Streak Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Streak Distribution</CardTitle>
                  <CardDescription>Duration of streaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStreakDistribution(selectedStat)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {getStreakDistribution(selectedStat).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment & Recommendations</CardTitle>
                <CardDescription>Actionable insights based on your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  selectedStat.riskLevel === 'low' ? 'bg-green-50' :
                  selectedStat.riskLevel === 'medium' ? 'bg-yellow-50' :
                  'bg-red-50'
                }`}>
                  <h3 className="font-semibold mb-2">Current Risk Level: {selectedStat.riskLevel.toUpperCase()}</h3>
                  <p className="text-sm">
                    {selectedStat.riskLevel === 'low' 
                      ? "You're doing great! Keep maintaining your current habits."
                      : selectedStat.riskLevel === 'medium'
                      ? "Stay vigilant - you're in a sensitive period. Focus on maintaining consistency."
                      : "High risk of breaking your streak. Consider implementing additional accountability measures."}
                  </p>
                </div>

                {selectedStat.hasImprovedPattern && (
                  <div className="p-4 rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Positive Pattern Detected
                    </h3>
                    <p className="text-sm">
                      You're showing consistent improvement in your habit maintenance!
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-purple-50">
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="text-sm space-y-2">
                    {selectedStat.currentStreak < selectedStat.avgDaysBetweenResets && (
                      <li>• Focus on surpassing your average streak duration of {selectedStat.avgDaysBetweenResets} days</li>
                    )}
                    {selectedStat.streakConsistency < 75 && (
                      <li>• Work on improving your consistency score by maintaining regular streaks</li>
                    )}
                    {selectedStat.shortTermImprovement < 0 && (
                      <li>• Your recent performance has declined - consider reviewing your triggers and obstacles</li>
                    )}
                  </ul>
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
