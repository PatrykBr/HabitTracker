
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '@/hooks/use-habits';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import { StatsHeader } from '@/components/stats/StatsHeader';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { StatsCharts } from '@/components/stats/StatsCharts';
import { calculateStats, calculateCombinedStats } from '@/utils/statsCalculator';
import { getWeeklyDistribution, getStreakDistribution } from '@/utils/statistics';

export default function Statistics() {
  const { habits } = useHabits();
  const navigate = useNavigate();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const { toast } = useToast();

  const stats = calculateStats(habits);
  const selectedHabit = selectedHabitId === 'all' ? null : habits.find(h => h.id === selectedHabitId);
  const selectedStats = selectedHabitId === 'all' 
    ? calculateCombinedStats(stats)
    : stats.find(s => s.name === selectedHabit?.name);

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

  const weeklyData = selectedHabitId === 'all'
    ? getWeeklyDistributionForAll()
    : selectedHabit ? getWeeklyDistribution(selectedHabit.resets) : [];

  const streakDistributionData = selectedStats ? getStreakDistribution(selectedHabit, selectedStats) : [];

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
            <StatsOverview stats={selectedStats} />
            <StatsCharts
              selectedStats={selectedStats}
              selectedHabit={selectedHabit}
              weeklyData={weeklyData}
              streakDistributionData={streakDistributionData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
