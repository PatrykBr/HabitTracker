import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface HabitType {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
  createdAt: string;
  category?: string;
}

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitResetRow = Database['public']['Tables']['habit_resets']['Row'];

export interface Habit {
  id: string;
  name: string;
  lastReset: Date;
  resets: Date[];
  category?: string;
}

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

      return (habits as (HabitRow & { habit_resets: HabitResetRow[] })[]).map((habit) => {
        // Convert UTC dates to local timezone
        const lastReset = toZonedTime(new Date(habit.last_reset), userTimeZone);
        const resets = habit.habit_resets.map((reset) => 
          toZonedTime(new Date(reset.reset_time), userTimeZone)
        );
        
        const processedHabit = {
          id: habit.id,
          name: habit.name,
          lastReset,
          resets,
          createdAt: habit.created_at
        };
        
        return processedHabit;
      });
    },
  });

  const addHabitMutation = useMutation({
    mutationFn: async (params: { name: string; category?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          name: params.name,
          user_id: user.id,
          // Only include category if it's provided and not empty
          ...(params.category ? { category: params.category } : {})
        })
        .select();

      if (error) {
        console.error('Error adding habit:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from habit insert');
      }

      const newHabit = data[0];

      // Then, insert the initial reset
      const now = new Date();
      const utcDate = fromZonedTime(now, userTimeZone);
      const resetTime = utcDate.toISOString();

      const { error: resetError } = await supabase
        .from('habit_resets')
        .insert({
          habit_id: newHabit.id,
          reset_time: resetTime
        });

      if (resetError) {
        console.error('Error adding initial reset:', resetError);
        throw resetError;
      }

      return newHabit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: "Habit added",
        description: "Your new habit has been successfully added.",
      });
    },
    onError: (error) => {
      console.error('Habit creation error:', error);
      toast({
        title: "Error adding habit",
        description: error.message || "There was a problem adding your habit.",
        variant: "destructive"
      });
    }
  });

  const resetHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      // Convert local time to UTC for storage
      const localDate = new Date();
      const utcDate = fromZonedTime(localDate, userTimeZone);
      const resetTime = utcDate.toISOString();
      
      const { error: updateError } = await supabase
        .from('habits')
        .update({ last_reset: resetTime })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('habit_resets')
        .insert({ 
          habit_id: id,
          reset_time: resetTime
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const addCustomResetMutation = useMutation({
    mutationFn: async ({ habitId, resetTime }: { habitId: string; resetTime: Date }) => {
      // Convert the local date to UTC for storage
      const utcDate = fromZonedTime(resetTime, userTimeZone);
      const isoResetTime = utcDate.toISOString();
      
      const { error: insertError } = await supabase
        .from('habit_resets')
        .insert({ 
          habit_id: habitId,
          reset_time: isoResetTime
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
      // Convert local date to UTC for comparison
      const utcDate = fromZonedTime(resetTime, userTimeZone);
      
      // Create a range in UTC
      const startTime = new Date(utcDate.getTime() - 1000); // 1 second before
      const endTime = new Date(utcDate.getTime() + 1000);   // 1 second after

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

      const targetReset = resets[0];
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

  const editHabitMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('habits')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: "Habit updated",
        description: "Your habit has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all resets associated with this habit
      const { error: resetError } = await supabase
        .from('habit_resets')
        .delete()
        .eq('habit_id', id);

      if (resetError) throw resetError;

      // Then delete the habit itself
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: "Habit deleted",
        description: "Your habit has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    habits,
    isLoading,
    addHabit: addHabitMutation.mutateAsync,
    resetHabit: resetHabitMutation.mutateAsync,
    addCustomReset: addCustomResetMutation.mutateAsync,
    removeReset: removeResetMutation.mutateAsync,
    editHabit: editHabitMutation.mutateAsync,
    deleteHabit: deleteHabitMutation.mutateAsync,
  };
}
