import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/use-habits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Trash2, LogOut, ChevronLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationState {
  isOpen: boolean;
  habitId: string | null;
  habitName: string;
}

export default function Settings() {
  const { habits, deleteHabit } = useHabits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    habitId: null,
    habitName: '',
  });

  const handleDeleteHabit = (id: string, name: string) => {
    setDeleteConfirmation({
      isOpen: true,
      habitId: id,
      habitName: name,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.habitId) {
      deleteHabit(deleteConfirmation.habitId);
      toast({
        title: "Habit deleted",
        description: `${deleteConfirmation.habitName} has been removed from your habits.`,
      });
      setDeleteConfirmation({
        isOpen: false,
        habitId: null,
        habitName: '',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-4 w-4" />
            <h2 className="text-base sm:text-lg font-semibold">Manage Habits</h2>
          </div>
          <div className="space-y-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
              >
                <span className="text-sm sm:text-base">{habit.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteHabit(habit.id, habit.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteConfirmation(prev => ({ ...prev, isOpen }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirmation.habitName}" and all its history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
