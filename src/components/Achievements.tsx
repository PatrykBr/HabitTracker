
import { useEffect } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { ACHIEVEMENTS, checkAchievements } from '@/utils/achievements';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ACHIEVEMENTS.map((achievement) => {
        const isUnlocked = checkAchievements(habits).some(a => a.id === achievement.id);
        
        return (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border ${
              isUnlocked 
                ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xl mb-1">{achievement.icon}</span>
                <h3 className="font-medium text-sm">{achievement.name}</h3>
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
              {isUnlocked && (
                <span className="text-yellow-600">✓</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
