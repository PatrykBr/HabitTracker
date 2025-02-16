
import { useState, useEffect } from 'react';

export interface Habit {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      lastReset: new Date(),
      resets: [new Date()],
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const resetHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          return {
            ...habit,
            lastReset: new Date(),
            resets: [...habit.resets, new Date()],
          };
        }
        return habit;
      })
    );
  };

  const removeReset = (habitId: string, resetIndex: number) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === habitId) {
          const newResets = [...habit.resets];
          newResets.splice(resetIndex, 1);
          return {
            ...habit,
            lastReset: newResets[newResets.length - 1] || new Date(),
            resets: newResets,
          };
        }
        return habit;
      })
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  };

  return {
    habits,
    addHabit,
    resetHabit,
    removeReset,
    deleteHabit,
  };
}
