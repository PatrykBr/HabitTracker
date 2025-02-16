
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: Date;
}

export type AchievementType = 
  | 'streak'
  | 'total_days'
  | 'consistency'
  | 'improvement';
