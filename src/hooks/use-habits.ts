import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { create } from "zustand";

export interface HabitType {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
  createdAt: string;
}

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitResetRow = Database['public']['Tables']['habit_resets']['Row'];

export interface Habit {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
}

export function useHabits() {
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

      return (habits as (HabitRow & { habit_resets: HabitResetRow[] })[]).map((habit) => ({
        id: habit.id,
        name: habit.name,
        lastReset: new Date(habit.last_reset),
        resets: habit.habit_resets.map((reset) => new Date(reset.reset_time)),
        createdAt: habit.created_at
      }));
    },
  });

  const addHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          name,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('habit_resets')
        .insert({
          habit_id: data.id,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const resetHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ last_reset: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('habit_resets')
        .insert({ habit_id: id });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const addCustomResetMutation = useMutation({
    mutationFn: async ({ habitId, resetTime }: { habitId: string; resetTime: Date }) => {
      const { error: insertError } = await supabase
        .from('habit_resets')
        .insert({ 
          habit_id: habitId,
          reset_time: resetTime.toISOString()
        });

      if (insertError) throw insertError;

      // Update last_reset if this is the most recent reset
      const { data: resets } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .order('reset_time', { ascending: false })
        .limit(1);

      if (resets && resets.length > 0) {
        await supabase
          .from('habits')
          .update({ last_reset: resets[0].reset_time })
          .eq('id', habitId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const removeResetMutation = useMutation({
    mutationFn: async ({ habitId, resetTime }: { habitId: string; resetTime: Date }) => {
      // Instead of using string comparison, use date range query
      const startTime = new Date(resetTime.getTime());
      const endTime = new Date(resetTime.getTime() + 999); // Add 999ms to cover potential microsecond differences

      const { data: resets, error: fetchError } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .gte('reset_time', startTime.toISOString())
        .lt('reset_time', endTime.toISOString())
        .order('reset_time', { ascending: false });

      if (fetchError) throw fetchError;
      if (!resets?.length) throw new Error('Reset not found in the specified time range');

      // Get all resets to determine if this is the latest
      const { data: allResets, error: allResetsError } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .order('reset_time', { ascending: false });

      if (allResetsError) throw allResetsError;
      if (!allResets?.length) throw new Error('No resets found');

      const targetReset = resets[0]; // Use the first match in our time range
      const isLatestReset = allResets[0].reset_time === targetReset.reset_time;
      const nextLatestReset = isLatestReset && allResets.length > 1 
        ? allResets[1].reset_time 
        : null;

      // Delete the reset
      const { error: deleteError } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', habitId)
        .eq('reset_time', targetReset.reset_time);

      if (deleteError) throw deleteError;

      // Update last_reset if needed
      if (isLatestReset) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({
            last_reset: nextLatestReset || new Date(0).toISOString()
          })
          .eq('id', habitId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: "Reset removed",
        description: "The habit reset has been successfully removed.",
      });
    },
    onError: (error: Error) => {
      console.error('Reset removal error:', error);
      toast({
        title: "Error removing reset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  return {
    habits,
    isLoading,
    addHabit: addHabitMutation.mutate,
    resetHabit: resetHabitMutation.mutate,
    addCustomReset: addCustomResetMutation.mutate,
    removeReset: (habitId: string, resetIndex: number) => {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        console.log('Found habit:', habit);
        console.log('Reset to remove:', {
          index: resetIndex,
          reset: habit.resets[resetIndex]
        });
        removeResetMutation.mutate({
          habitId,
          resetTime: habit.resets[resetIndex],
        });
      } else {
        console.error('Habit not found:', habitId);
      }
    },
    deleteHabit: deleteHabitMutation.mutate,
  };
}
