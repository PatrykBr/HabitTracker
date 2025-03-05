import { Habit } from './habits/habit.types';

// Statistics period options
export type StatisticsPeriod = 'week' | 'month' | 'year' | 'all';

// Chart data point
export interface ChartDataPoint {
  date: string;
  value: number;
}

// Streak data
export interface StreakData {
  current: number;
  longest: number;
  average: number;
}

// Reset distribution by day of week
export interface DayDistribution {
  day: string;
  count: number;
  percentage: number;
}

// Habit statistics
export interface HabitStatistics {
  habit: Habit;
  streaks: StreakData;
  resetCount: number;
  dayDistribution: DayDistribution[];
  chartData: ChartDataPoint[];
} 