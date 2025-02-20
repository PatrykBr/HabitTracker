import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '@/hooks/use-habits';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import { StatsHeader } from '@/components/stats/StatsHeader';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { StatsCharts } from '@/components/stats/StatsCharts';
import { calculateStats, calculateCombinedStats } from '@/utils/statsCalculator';
import { getWeeklyDistribution, getStreakDistribution, getCommonResetTimes } from '@/utils/statistics';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const { toast } = useToast();

  const getWeeklyDistributionForAll = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const combinedData = days.map(day => ({ name: day, count: 0 }));
    
    habits.forEach(habit => {
      const habitWeekly = getWeeklyDistribution(habit.resets);
      habitWeekly.forEach((day, index) => {
        combinedData[index].count += day.count;
      });
    });
    
    return combinedData;
  };

  const stats = calculateStats(habits);
  const selectedHabit = selectedHabitId === 'all' ? null : habits.find(h => h.id === selectedHabitId);
  const selectedStats = selectedHabitId === 'all' 
    ? calculateCombinedStats(stats)
    : stats.find(s => s.name === selectedHabit?.name);

  const weeklyData = selectedHabitId === 'all'
    ? getWeeklyDistributionForAll()
    : selectedHabit ? getWeeklyDistribution(selectedHabit.resets) : [];

  const streakDistributionData = selectedStats ? getStreakDistribution(selectedHabit, selectedStats) : [];
  
  const commonTimes = selectedHabit 
    ? getCommonResetTimes(selectedHabit.resets)
    : getCommonResetTimes(habits.flatMap(h => h.resets));

  const exportData = () => {
    if (!selectedStats) return;

    const data = {
      habitName: selectedStats.name,
      statistics: {
        totalResets: selectedStats.totalResets,
        currentStreak: selectedStats.currentStreak,
        longestStreak: selectedStats.longestStreak,
        successRate: selectedStats.successRate,
        streakConsistency: selectedStats.streakConsistency,
        monthlyResets: selectedStats.monthlyResets,
        trendScore: selectedStats.trendScore
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStats.name.toLowerCase().replace(/\s+/g, '-')}-stats.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Statistics Exported",
      description: "Your statistics have been downloaded as a JSON file.",
    });
  };

  if (habits.length === 0) {
    return (
      <div className="page-container">
        <div className="content-container">
          <Card className="card-glass">
            <CardContent className="p-6">
              <p className="text-center text-gray-600">No habits found. Add some habits to see statistics.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container">
        {/* Header Section */}
        <StatsHeader
          habits={habits}
          selectedHabitId={selectedHabitId}
          onHabitChange={setSelectedHabitId}
          onExport={exportData}
          onBack={() => navigate('/')}
        />

        {selectedStats && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <StatsOverview stats={selectedStats} />

            {/* Main Charts and Analysis */}
            <Card className="card-glass">
              <CardContent className="p-6">
                <StatsCharts
                  selectedStats={selectedStats}
                  selectedHabit={selectedHabit}
                  weeklyData={weeklyData}
                  streakDistributionData={streakDistributionData}
                  commonTimes={commonTimes}
                />
              </CardContent>
            </Card>

            {/* Insights Card */}
            <Card className="card-glass">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-gray-700 mb-2">
                  Insights
                </h3>
                <p className="text-sm text-gray-500">
                  Track your progress patterns and focus on building consistent habits.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
