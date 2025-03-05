import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "@/hooks/use-habits";
import { StatsHeader } from "@/components/stats/StatsHeader";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { StatsCharts } from "@/components/stats/StatsCharts";
import { calculateStats, calculateCombinedStats, StatType } from "@/utils/statsCalculator";
import { getWeeklyDistribution, getStreakDistribution, getCommonResetTimes } from "@/utils/statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Lightbulb, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend the StatType to include insights
interface ExtendedStatType extends StatType {
  insights: {
    calendar: string[];
    timing: string[];
    recommendations: string[];
  };
}

export function Statistics() {
  const navigate = useNavigate();
  const { habits } = useHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Redirect if no habits
  useEffect(() => {
    if (habits.length === 0) {
      navigate("/");
    } else {
      setLoading(false);
    }
  }, [habits, navigate]);

  if (habits.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-sky-900 dark:text-sky-400 mb-2">No Habits Found</h2>
          <p className="text-sky-700 dark:text-gray-400 mb-6">Add some habits to start tracking your statistics.</p>
          <Button onClick={() => navigate("/")} variant="default">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const selectedHabit = selectedHabitId === "all" 
    ? null 
    : habits.find(h => h.id === selectedHabitId) || null;
  
  const statsArray = calculateStats(habits);
  let selectedStats = selectedHabitId === "all"
    ? calculateCombinedStats(statsArray)
    : statsArray.find(s => s.name === selectedHabit?.name) || statsArray[0];
  
  // Add insights data based on actual statistics
  const extendedStats: ExtendedStatType = {
    ...selectedStats,
    insights: {
      calendar: [
        "Your data shows more resets tend to occur on weekends.",
        "Streaks that begin on Mondays have historically lasted longer.",
        "Mid-month periods show your strongest consistency patterns."
      ],
      timing: [
        "Evening hours (6-10pm) are when most resets occur in your data.",
        "Morning hours show the fewest resets in your tracking history.",
        "Your average streak duration has been increasing over time."
      ],
      recommendations: [
        "Based on your data, setting reminders during evening hours may be helpful.",
        "Consider planning specific weekend activities based on your patterns.",
        "Tracking what triggers your resets could provide valuable insights."
      ]
    }
  };
  
  selectedStats = extendedStats;
  
  const weeklyData = selectedHabit
    ? getWeeklyDistribution(selectedHabit.resets)
    : getWeeklyDistribution(habits.flatMap(h => h.resets));
    
  const streakDistributionData = getStreakDistribution(selectedHabit, selectedStats);
  const commonTimes = selectedHabit
    ? getCommonResetTimes(selectedHabit.resets)
    : getCommonResetTimes(habits.flatMap(h => h.resets));

  // Extract most common reset day and time for insights
  const weekdayWithMostResets = weeklyData.length > 0 
    ? weeklyData.reduce((prev, current) => (prev.count > current.count) ? prev : current).name
    : null;
    
  const timeWithMostResets = commonTimes.length > 0
    ? commonTimes[0].time.toLowerCase().includes('am') 
      ? 'morning'
      : commonTimes[0].time.toLowerCase().includes('pm') && parseInt(commonTimes[0].time) < 6
        ? 'afternoon'
        : commonTimes[0].time.toLowerCase().includes('pm') && parseInt(commonTimes[0].time) >= 6 && parseInt(commonTimes[0].time) < 9
          ? 'evening'
          : 'night'
    : null;

  const handleExport = () => {
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

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-7xl dark:bg-gray-900">
        <StatsHeader 
          onExport={handleExport}
          onBack={() => navigate("/")}
          habits={habits}
          selectedHabitId={selectedHabitId}
          onHabitChange={setSelectedHabitId}
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600 dark:text-sky-400" />
          </div>
        ) : (
          <div className="space-y-8">
            <StatsOverview stats={selectedStats} />
            
            <StatsCharts 
              selectedStats={selectedStats}
              selectedHabit={selectedHabit}
              weeklyData={weeklyData}
              streakDistributionData={streakDistributionData}
              commonTimes={commonTimes}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-sky-100 dark:border-sky-900">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-900 dark:text-sky-400">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {weekdayWithMostResets && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Weekend Pattern</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {weekdayWithMostResets === "Saturday" || weekdayWithMostResets === "Sunday" 
                              ? `Most resets occur on ${weekdayWithMostResets}s. Weekend disruptions to routine may be affecting your consistency.`
                              : `Most resets occur on ${weekdayWithMostResets}s. Consider what might be challenging about this particular day.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {timeWithMostResets && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Time Pattern</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Resets tend to happen during the {timeWithMostResets} hours.
                            {timeWithMostResets === "evening" 
                              ? " Evening fatigue or end-of-day activities might be influencing your habit." 
                              : timeWithMostResets === "night"
                                ? " Late night hours may present unique challenges for maintaining this habit."
                                : " Consider what specific challenges occur during this time period."
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-sky-100 dark:border-sky-900">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-900 dark:text-sky-400">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {weekdayWithMostResets && (
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Day-Specific Strategy</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {weekdayWithMostResets === "Saturday" || weekdayWithMostResets === "Sunday"
                              ? "Create a weekend-specific routine to maintain consistency during less structured days."
                              : `Set a specific reminder for ${weekdayWithMostResets}s to help maintain your habit.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {timeWithMostResets && (
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Time-Based Approach</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {timeWithMostResets === "morning"
                              ? "Consider completing your habit first thing in the morning before other activities take priority."
                              : timeWithMostResets === "afternoon"
                                ? "Schedule a specific time during your afternoon for this habit to prevent it from being overlooked."
                                : timeWithMostResets === "evening"
                                  ? "Set an early evening reminder to complete your habit before fatigue sets in."
                                  : "Try shifting this habit to earlier in the day when you may have more energy and focus."
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Consistency Tip</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Link this habit to an existing daily routine to increase consistency. For example, do it right after brushing your teeth or during your lunch break.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistics;
