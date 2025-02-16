
import type { Achievement } from '@/types/achievements';
import type { Habit } from '@/hooks/use-habits';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_week',
    name: '1 Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🌱',
    condition: 'streak_7'
  },
  {
    id: 'first_month',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌟',
    condition: 'streak_30'
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Achieve 90% consistency over 30 days',
    icon: '👑',
    condition: 'consistency_90'
  },
  {
    id: 'habit_hero',
    name: 'Habit Hero',
    description: 'Complete 100 days total across all habits',
    icon: '🦸',
    condition: 'total_100'
  },
  {
    id: 'improvement_master',
    name: 'Improvement Master',
    description: 'Show 50% improvement over 3 months',
    icon: '📈',
    condition: 'improvement_50'
  }
];

export function checkAchievements(habits: Habit[]): Achievement[] {
  const unlockedAchievements: Achievement[] = [];
  
  // Check streak-based achievements
  const maxStreak = Math.max(...habits.map(h => Math.max(
    ...h.resets.map((_, i, arr) => {
      if (i === 0) return 0;
      return Math.floor((new Date(arr[i]).getTime() - new Date(arr[i - 1]).getTime()) / (1000 * 60 * 60 * 24));
    })
  )));

  if (maxStreak >= 7) {
    unlockedAchievements.push({
      ...ACHIEVEMENTS.find(a => a.id === 'first_week')!,
      unlockedAt: new Date()
    });
  }

  if (maxStreak >= 30) {
    unlockedAchievements.push({
      ...ACHIEVEMENTS.find(a => a.id === 'first_month')!,
      unlockedAt: new Date()
    });
  }

  // Check total days achievement
  const totalDays = habits.reduce((sum, habit) => {
    const firstReset = new Date(Math.min(...habit.resets.map(d => d.getTime())));
    const lastReset = new Date(Math.max(...habit.resets.map(d => d.getTime())));
    const days = Math.floor((lastReset.getTime() - firstReset.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);

  if (totalDays >= 100) {
    unlockedAchievements.push({
      ...ACHIEVEMENTS.find(a => a.id === 'habit_hero')!,
      unlockedAt: new Date()
    });
  }

  // Check consistency achievement
  const avgConsistency = habits.reduce((sum, habit) => {
    const totalPossibleDays = Math.floor(
      (new Date().getTime() - new Date(habit.resets[0]).getTime()) / (1000 * 60 * 60 * 24)
    );
    const successRate = ((totalPossibleDays - habit.resets.length) / totalPossibleDays) * 100;
    return sum + successRate;
  }, 0) / habits.length;

  if (avgConsistency >= 90) {
    unlockedAchievements.push({
      ...ACHIEVEMENTS.find(a => a.id === 'consistency_king')!,
      unlockedAt: new Date()
    });
  }

  return unlockedAchievements;
}
