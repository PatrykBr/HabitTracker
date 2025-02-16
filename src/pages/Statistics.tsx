
import { useHabits } from '@/hooks/use-habits';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BarChart } from 'lucide-react';
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
  ResponsiveContainer
} from 'recharts';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();

  const calculateStats = () => {
    const now = new Date();
    return habits.map(habit => {
      const totalResets = habit.resets.length;
      const resetDates = habit.resets.map(date => new Date(date));
      
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

      return {
        name: habit.name,
        totalResets,
        avgDaysBetweenResets,
        currentStreak,
      };
    });
  };

  const stats = calculateStats();

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
          <Card>
            <CardHeader>
              <CardTitle>Total Habits</CardTitle>
              <CardDescription>Number of tracked habits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{habits.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Resets</CardTitle>
              <CardDescription>Across all habits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {habits.reduce((sum, habit) => sum + habit.resets.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Streak</CardTitle>
              <CardDescription>Days between resets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {Math.round(stats.reduce((sum, stat) => sum + stat.avgDaysBetweenResets, 0) / (stats.length || 1))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reset Frequency Chart */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Reset Frequency by Habit</CardTitle>
            <CardDescription>Number of resets per habit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalResets" fill="#8884d8" name="Total Resets" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>Breakdown by habit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Habit</th>
                    <th className="px-6 py-3">Total Resets</th>
                    <th className="px-6 py-3">Avg. Days Between</th>
                    <th className="px-6 py-3">Current Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.name} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{stat.name}</td>
                      <td className="px-6 py-4">{stat.totalResets}</td>
                      <td className="px-6 py-4">{stat.avgDaysBetweenResets}</td>
                      <td className="px-6 py-4">{stat.currentStreak}</td>
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
