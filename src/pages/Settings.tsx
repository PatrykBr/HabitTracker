import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/use-habits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Trash2, LogOut, ChevronLeft, Sparkles, Moon, Sun } from 'lucide-react';
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has a preference stored
    const savedPreference = localStorage.getItem("darkMode");
    return savedPreference === "true" || 
      (savedPreference === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const [showQuotes, setShowQuotes] = useState(() => {
    // Check if user has a preference stored for quotes
    const savedPreference = localStorage.getItem("showQuotes");
    // Default to true if no preference is set
    return savedPreference === null ? true : savedPreference === "true";
  });

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Save quotes preference
  useEffect(() => {
    localStorage.setItem("showQuotes", showQuotes.toString());
  }, [showQuotes]);

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
    <div className="page-container dark:bg-gray-900 transition-colors duration-300">
      <div className="content-container">
        {/* Header */}
        <div className="page-header">
          <div className="title-container">
            <h1 className="page-title dark:text-white">Settings</h1>
            <Settings2 className="h-6 w-6 text-primary dark:text-purple-400 animate-pulse" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="bg-white/80 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-300 border-purple-100 dark:border-gray-700 backdrop-blur-sm group gap-2 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Appearance Section */}
        <Card className="card-glass dark:bg-gray-800/90 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
              {darkMode ? (
                <Moon className="h-5 w-5 text-purple-400" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-300">Dark Mode</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-300">Motivational Quotes</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Show motivational quotes on the dashboard
                </p>
              </div>
              <Switch
                checked={showQuotes}
                onCheckedChange={setShowQuotes}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Manage Habits Section */}
        <Card className="card-glass dark:bg-gray-800/90 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
              <Sparkles className="h-5 w-5 text-primary dark:text-purple-400" />
              Manage Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-gray-400 text-center py-4">
                No habits to manage. Add some habits to get started!
              </p>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-purple-100 dark:border-gray-600 hover:border-primary/20 dark:hover:border-purple-500/20 hover:bg-purple-50/50 dark:hover:bg-gray-600/50 transition-all duration-200"
                >
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{habit.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHabit(habit.id, habit.name)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:bg-red-400/10 transition-colors"
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
        <Card className="card-glass dark:bg-gray-800/90 dark:border-gray-700">
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
        <AlertDialogContent className="card-glass dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-200">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This will permanently delete "{deleteConfirmation.habitName}" and all its history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
