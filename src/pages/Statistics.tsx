
import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BarChart, Award, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
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
  Legend
} from 'recharts';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();

  const calculateStats = () => {
    const now = new Date();
    return habits.map(habit => {
      const totalResets = habit.resets.length;
      const resetDates = habit.resets.map(date => new Date(date));
      resetDates.sort((a, b) => a.getTime() - b.getTime());
      
      // Calculate average time between resets
      let totalTimeBetween = 0;
      for (let i = 1; i < resetDates.length; i++) {
        totalTimeBetween += resetDates[i].getTime() - resetDates[i-1].getTime();
      }
      const avgDaysBetweenResets = totalResets > 1 
        ? Math.round(totalTimeBetween / (totalResets - 1) / (1000 * 60 * 60 * 24)) 
        : 0;

      // Calculate current streak
      const lastReset = new Date(habit.lastReset);
      const currentStreak = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate longest streak
      let longestStreak = currentStreak;
      for (let i = 0; i < resetDates.length - 1; i++) {
        const streak = Math.floor(
          (resetDates[i + 1].getTime() - resetDates[i].getTime()) / (1000 * 60 * 60 * 24)
        );
        longestStreak = Math.max(longestStreak, streak);
      }

      // Calculate reset frequency by month
      const monthlyResets: { [key: string]: number } = {};
      resetDates.forEach(date => {
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyResets[monthYear] = (monthlyResets[monthYear] || 0) + 1;
      });

      // Calculate improvement trend (comparing last 2 months)
      const monthKeys = Object.keys(monthlyResets).sort();
      const lastMonth = monthlyResets[monthKeys[monthKeys.length - 1]] || 0;
      const previousMonth = monthlyResets[monthKeys[monthKeys.length - 2]] || 0;
      const improvement = previousMonth ? (previousMonth - lastMonth) / previousMonth * 100 : 0;

      return {
        name: habit.name,
        totalResets,
        avgDaysBetweenResets,
        currentStreak,
        longestStreak,
        monthlyResets: Object.entries(monthlyResets).map(([month, count]) => ({
          month,
          count
        })),
        improvement,
      };
    });
  };

  const stats = calculateStats();

  // Find habit with best current streak
  const bestStreak = Math.max(...stats.map(s => s.currentStreak));
  const bestStreakHabit = stats.find(s => s.currentStreak === bestStreak);

  // Calculate overall improvement
  const overallImprovement = stats.reduce((sum, stat) => sum + stat.improvement, 0) / stats.length;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Statistics</h1>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Best Current Streak
              </CardTitle>
              <CardDescription>
                {bestStreakHabit?.name || 'No habits yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{bestStreak} days</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Average Streak
              </CardTitle>
              <CardDescription>Across all habits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                {Math.round(stats.reduce((sum, stat) => sum + stat.avgDaysBetweenResets, 0) / (stats.length || 1))} days
              </p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${overallImprovement > 0 ? 'from-green-50' : 'from-red-50'} to-white`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {overallImprovement > 0 ? (
                  <ArrowUp className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-red-600" />
                )}
                Monthly Trend
              </CardTitle>
              <CardDescription>Compared to last month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${overallImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(Math.round(overallImprovement))}%
                {overallImprovement > 0 ? ' better' : ' more resets'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Chart */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Monthly Reset Trends</CardTitle>
            <CardDescription>How habits have evolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
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
                    <Line
                      key={habit.name}
                      data={habit.monthlyResets}
                      name={habit.name}
                      dataKey="count"
                      stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>Comprehensive breakdown by habit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Habit</th>
                    <th className="px-6 py-3">Current Streak</th>
                    <th className="px-6 py-3">Longest Streak</th>
                    <th className="px-6 py-3">Avg. Days Between</th>
                    <th className="px-6 py-3">Monthly Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.name} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{stat.name}</td>
                      <td className="px-6 py-4">{stat.currentStreak} days</td>
                      <td className="px-6 py-4">{stat.longestStreak} days</td>
                      <td className="px-6 py-4">{stat.avgDaysBetweenResets} days</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 ${stat.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.improvement > 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                          {Math.abs(Math.round(stat.improvement))}%
                        </span>
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
