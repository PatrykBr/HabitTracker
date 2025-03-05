import { useEffect, useRef } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { ACHIEVEMENTS, checkAchievements } from '@/utils/achievements';
import { useToast } from '@/hooks/use-toast';

export function Achievements() {
  const { habits } = useHabits();
  const { toast } = useToast();
  const processedAchievements = useRef<Set<string>>(new Set());
  const initialCheckTime = useRef(Date.now());
  
  useEffect(() => {
    if (habits.length > 0) {
      const unlockedAchievements = checkAchievements(habits);
      
      unlockedAchievements.forEach(achievement => {
        if (
          achievement.unlockedAt && 
          achievement.unlockedAt.getTime() > initialCheckTime.current && 
          !processedAchievements.current.has(achievement.id)
        ) {
          processedAchievements.current.add(achievement.id);
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
                ? 'bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 border-yellow-200 dark:border-yellow-900/30' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xl mb-1">{achievement.icon}</span>
                <h3 className="font-medium text-sm dark:text-gray-200">{achievement.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
              </div>
              {isUnlocked && (
                <span className="text-yellow-600 dark:text-yellow-500">✓</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
