import { Database } from '@/integrations/supabase/types';

// Database row types
export type HabitRow = Database['public']['Tables']['habits']['Row'];
export type HabitResetRow = Database['public']['Tables']['habit_resets']['Row'];

// Application habit type
export interface Habit {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
  createdAt: string;
  category?: string;
}

// Habit creation input
export interface HabitInput {
  name: string;
  category?: string;
}

// Habit edit input
export interface HabitEditInput {
  id: string;
  name: string;
  category?: string;
} 