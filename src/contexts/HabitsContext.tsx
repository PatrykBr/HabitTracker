import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitInput } from '@/types/habits/habit.types';
import { useToast } from '@/hooks/use-toast';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

interface HabitsContextType {
  habits: Habit[];
  isLoading: boolean;
  addHabit: (habitData: HabitInput) => Promise<void>;
  resetHabit: (habitId: string) => Promise<void>;
  addCustomReset: (habitId: string, resetTime: Date) => Promise<void>;
  removeReset: (habitId: string, resetIndex: number) => Promise<void>;
  editHabit: (id: string, newName: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function HabitsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: habits, error } = await supabase
        .from('habits')
        .select(`
          id,
          name,
          last_reset,
          created_at,
          habit_resets (
            reset_time
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return habits.map(habit => ({
        id: habit.id,
        name: habit.name,
        lastReset: new Date(habit.last_reset),
        createdAt: habit.created_at,
        resets: habit.habit_resets.map(reset => new Date(reset.reset_time))
      }));
    }
  });

  const addHabitMutation = useMutation({
    mutationFn: async (habitData: HabitInput) => {
      const now = new Date();
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            name: habitData.name,
            last_reset: now.toISOString(),
            category: habitData.category
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const resetHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const now = new Date();
      
      // Add reset record
      const { error: resetError } = await supabase
        .from('habit_resets')
        .insert([
          {
            habit_id: habitId,
            reset_time: now.toISOString()
          }
        ]);

      if (resetError) throw resetError;

      // Update last reset time
      const { error: updateError } = await supabase
        .from('habits')
        .update({ last_reset: now.toISOString() })
        .eq('id', habitId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const addCustomResetMutation = useMutation({
    mutationFn: async ({ habitId, resetTime }: { habitId: string, resetTime: Date }) => {
      // Add reset record
      const { error: resetError } = await supabase
        .from('habit_resets')
        .insert([
          {
            habit_id: habitId,
            reset_time: resetTime.toISOString()
          }
        ]);

      if (resetError) throw resetError;

      // Update last reset time if the custom reset is more recent
      const habit = habits.find(h => h.id === habitId);
      if (habit && resetTime > habit.lastReset) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({ last_reset: resetTime.toISOString() })
          .eq('id', habitId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const removeResetMutation = useMutation({
    mutationFn: async ({ habitId, resetIndex }: { habitId: string, resetIndex: number }) => {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');

      const resetToRemove = habit.resets[resetIndex];
      if (!resetToRemove) throw new Error('Reset not found');

      // Delete the reset
      const { error } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', habitId)
        .eq('reset_time', resetToRemove.toISOString());

      if (error) throw error;

      // If we're removing the most recent reset, update the last_reset to the previous one
      if (resetToRemove.getTime() === habit.lastReset.getTime() && habit.resets.length > 1) {
        // Find the new most recent reset
        const sortedResets = [...habit.resets]
          .filter((_, i) => i !== resetIndex)
          .sort((a, b) => b.getTime() - a.getTime());

        if (sortedResets.length > 0) {
          const newLastReset = sortedResets[0];
          const { error: updateError } = await supabase
            .from('habits')
            .update({ last_reset: newLastReset.toISOString() })
            .eq('id', habitId);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const editHabitMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string, newName: string }) => {
      const { error } = await supabase
        .from('habits')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete all resets first (due to foreign key constraint)
      const { error: resetsError } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', id);

      if (resetsError) throw resetsError;

      // Then delete the habit
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const addHabit = async (habitData: HabitInput) => {
    try {
      await addHabitMutation.mutateAsync(habitData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add habit. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetHabit = async (habitId: string) => {
    try {
      await resetHabitMutation.mutateAsync(habitId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset habit. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addCustomReset = async (habitId: string, resetTime: Date) => {
    try {
      await addCustomResetMutation.mutateAsync({ habitId, resetTime });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add custom reset. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeReset = async (habitId: string, resetIndex: number) => {
    try {
      await removeResetMutation.mutateAsync({ habitId, resetIndex });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove reset. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const editHabit = async (id: string, newName: string) => {
    try {
      await editHabitMutation.mutateAsync({ id, newName });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit habit. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await deleteHabitMutation.mutateAsync(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <HabitsContext.Provider value={{
      habits,
      isLoading,
      addHabit,
      resetHabit,
      addCustomReset,
      removeReset,
      editHabit,
      deleteHabit
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
} 