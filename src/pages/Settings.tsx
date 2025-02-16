
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-secondary/50 via-white to-secondary/30">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 hover:bg-secondary/80 transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Manage Habits Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <Trash2 className="h-5 w-5 text-primary" />
              Manage Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No habits to manage. Add some habits to get started!
              </p>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-secondary/20 transition-all duration-200"
                >
                  <span className="text-sm sm:text-base text-gray-700">{habit.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHabit(habit.id, habit.name)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-4">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full gap-2 hover:bg-destructive/90 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteConfirmation(prev => ({ ...prev, isOpen }))
        }
      >
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
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
