
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
        resetTime: resetTime.toISOString()
      });

      // 1. Get the exact timestamp from database first
      const { data: exactResets, error: precisionError } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .gte('reset_time', resetTime.toISOString().slice(0, -1))
        .lt('reset_time', new Date(resetTime.getTime() + 1000).toISOString().slice(0, -1))
        .single();

      if (precisionError) {
        console.error('Error finding exact reset:', precisionError);
        throw precisionError;
      }

      if (!exactResets) {
        throw new Error('Reset not found with exact timestamp');
      }

      const exactTimestamp = exactResets.reset_time;
      console.log('Found exact timestamp:', exactTimestamp);

      // 2. Check if this is the latest reset
      const { data: laterResets, error: checkError } = await supabase
        .from('habit_resets')
        .select('reset_time')
        .eq('habit_id', habitId)
        .gt('reset_time', exactTimestamp)
        .order('reset_time', { ascending: false });

      if (checkError) {
        console.error('Error checking for later resets:', checkError);
        throw checkError;
      }

      const isLatestReset = !laterResets || laterResets.length === 0;
      console.log('Is latest reset:', isLatestReset);

      // 3. If it's the latest, find the next latest reset
      let nextLatestReset: string | null = null;
      if (isLatestReset) {
        const { data: previousReset, error: prevError } = await supabase
          .from('habit_resets')
          .select('reset_time')
          .eq('habit_id', habitId)
          .lt('reset_time', exactTimestamp)
          .order('reset_time', { ascending: false })
          .limit(1)
          .single();

        if (prevError && prevError.code !== 'PGRST116') { // Ignore "no rows returned" error
          console.error('Error finding previous reset:', prevError);
          throw prevError;
        }

        nextLatestReset = previousReset?.reset_time || null;
        console.log('Next latest reset:', nextLatestReset || 'none');
      }

      // 4. Delete the reset
      const { error: deleteError } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', habitId)
        .eq('reset_time', exactTimestamp);

      if (deleteError) {
        console.error('Error deleting reset:', deleteError);
        throw deleteError;
      }

      // 5. Update last_reset if needed
      if (isLatestReset) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({
            last_reset: nextLatestReset || new Date(0).toISOString()
          })
          .eq('id', habitId);

        if (updateError) {
          console.error('Error updating habit last reset:', updateError);
          throw updateError;
        }

        console.log('Updated last_reset to:', nextLatestReset || 'epoch');
      } else {
        console.log('Not the latest reset - no need to update last_reset');
      }
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
