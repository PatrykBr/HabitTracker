
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/use-habits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Trash2, LogOut, ChevronLeft, Sparkles } from 'lucide-react';
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
        description: `${deleteConfirmation.habitName} has been removed.`,
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
    <div className="page-container">
      <div className="content-container">
        {/* Header */}
        <div className="page-header">
          <div className="title-container">
            <h1 className="page-title">Settings</h1>
            <Settings2 className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="bg-white/80 hover:bg-purple-50 transition-all duration-300 border-purple-100 backdrop-blur-sm group gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Manage Habits Section */}
        <Card className="card-glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <Sparkles className="h-5 w-5 text-primary" />
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
                  className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-purple-100 hover:border-primary/20 hover:bg-purple-50/50 transition-all duration-200"
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
        <Card className="card-glass">
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
        <AlertDialogContent className="card-glass">
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
