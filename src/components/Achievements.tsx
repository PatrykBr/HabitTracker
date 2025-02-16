
import { useEffect } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { ACHIEVEMENTS, checkAchievements } from '@/utils/achievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Achievements() {
  const { habits } = useHabits();
  const { toast } = useToast();
  
  useEffect(() => {
    if (habits.length > 0) {
      const unlockedAchievements = checkAchievements(habits);
      
      // Show toast for newly unlocked achievements
      unlockedAchievements.forEach(achievement => {
        if (achievement.unlockedAt && 
            achievement.unlockedAt.getTime() > Date.now() - 5000) { // Only show for achievements unlocked in the last 5 seconds
          toast({
            title: "Achievement Unlocked! 🎉",
            description: `${achievement.name}: ${achievement.description}`,
          });
        }
      });
    }
  }, [habits, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
        <CardDescription>Track your milestones and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = checkAchievements(habits).some(a => a.id === achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl mb-2">{achievement.icon}</span>
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                  {isUnlocked && (
                    <span className="text-yellow-600">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
