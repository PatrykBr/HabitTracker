
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '@/hooks/use-habits';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import { StatsHeader } from '@/components/stats/StatsHeader';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { StatsCharts } from '@/components/stats/StatsCharts';
import { TimeDistribution } from '@/components/stats/TimeDistribution';
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 overflow-hidden">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200 shadow-lg">
            <CardContent className="p-8">
              <p className="text-center text-sky-700">No habits found. Add some habits to see statistics.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 overflow-hidden">
      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" 
             style={{ transform: 'translate(20%, -20%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-700"
             style={{ transform: 'translate(-20%, 20%)' }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <StatsCharts
                  selectedStats={selectedStats}
                  selectedHabit={selectedHabit}
                  weeklyData={weeklyData}
                  streakDistributionData={streakDistributionData}
                />
              </div>
              <div className="space-y-4 sm:space-y-6">
                <TimeDistribution times={commonTimes} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
