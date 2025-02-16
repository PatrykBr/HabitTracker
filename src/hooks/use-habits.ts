import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface Habit {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
}

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitResetRow = Database['public']['Tables']['habit_resets']['Row'];

export function useHabits() {
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: habits, error } = await supabase
        .from('habits')
        .select(`
          id,
          name,
          last_reset,
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
      console.log('Starting reset removal:', { 
        habitId, 
        resetTime: resetTime.toISOString(),
        resetTimeRaw: resetTime
      });
      
      // First, fetch all resets for this habit to determine the next latest reset
      const { data: allResets, error: fetchError } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .order('reset_time', { ascending: false });

      if (fetchError) {
        console.error('Error fetching resets:', fetchError);
        throw fetchError;
      }

      // Find the next latest reset time (excluding the one we're about to delete)
      const nextLatestReset = allResets
        ?.filter(reset => reset.reset_time !== resetTime.toISOString())
        .sort((a, b) => new Date(b.reset_time).getTime() - new Date(a.reset_time).getTime())[0];

      console.log('Next latest reset:', nextLatestReset);

      // Update the habit's last_reset first if we're deleting the latest reset
      if (allResets?.[0]?.reset_time === resetTime.toISOString()) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({ 
            last_reset: nextLatestReset ? nextLatestReset.reset_time : new Date(0).toISOString() 
          })
          .eq('id', habitId);

        if (updateError) {
          console.error('Error updating habit last reset:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated habit last reset');
      }

      // Now delete the reset
      const { error: deleteError } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', habitId)
        .eq('reset_time', resetTime.toISOString());

      if (deleteError) {
        console.error('Error deleting reset:', deleteError);
        throw deleteError;
      }

      console.log('Successfully deleted reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
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
