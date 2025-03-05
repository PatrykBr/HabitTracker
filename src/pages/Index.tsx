import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings, Trophy, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/hooks/use-habits";
import { HabitCard } from "@/components/HabitCard";
import { Input } from "@/components/ui/input";
import { Achievements } from "@/components/Achievements";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { MilestoneConfetti } from "@/components/MilestoneConfetti";
import { EmptyState } from "@/components/EmptyState";
import { differenceInDays } from "date-fns";

export default function Index() {
  const [newHabitName, setNewHabitName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuote, setShowQuote] = useState(() => {
    // Check if user has a preference stored for quotes
    const savedPreference = localStorage.getItem("showQuotes");
    // Default to true if no preference is set
    return savedPreference === null ? true : savedPreference === "true";
  });
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { habits, addHabit, resetHabit, addCustomReset, removeReset, editHabit, deleteHabit } = useHabits();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      setIsLoading(true);
      try {
        await addHabit({
          name: newHabitName.trim()
        });
        setNewHabitName("");
        toast({
          title: "Habit added",
          description: "Your new habit has been created successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add habit. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditHabit = async (id: string, newName: string) => {
    try {
      await editHabit({ id, name: newName });
    } catch (error) {
      console.error("Error editing habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabit(id);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleDeleteReset = async (habitId: string, resetIndex: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      try {
        await removeReset({
          habitId,
          resetTime: habit.resets[resetIndex],
        });
      } catch (error) {
        console.error("Error removing reset:", error);
      }
    }
  };
  
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Get the habit with the longest streak if any
  const primaryHabit = habits.length > 0 
    ? [...habits].sort((a, b) => {
        const streakA = differenceInDays(new Date(), new Date(a.lastReset));
        const streakB = differenceInDays(new Date(), new Date(b.lastReset));
        return streakB - streakA;
      })[0]
    : null;
    
  const currentStreak = primaryHabit 
    ? differenceInDays(new Date(), new Date(primaryHabit.lastReset))
    : 0;

  return (
    <div className="page-container dark:bg-gray-900 transition-colors duration-300">
      <div className="content-container">
        {/* Header Section */}
        <div className="page-header">
          <div className="title-container">
            <h1 className="page-title dark:text-white">Habit Tracker</h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="bg-white/80 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-300 border-purple-100 dark:border-gray-700 backdrop-blur-sm group"
            >
              <BarChart2 className="h-5 w-5 text-primary dark:text-purple-400 group-hover:scale-110 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="bg-white/80 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-300 border-purple-100 dark:border-gray-700 backdrop-blur-sm group"
            >
              <Settings className="h-5 w-5 text-primary dark:text-purple-400 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="card-glass dark:bg-gray-800/90 dark:border-gray-700">
          <form onSubmit={handleAddHabit} className="flex gap-3 p-6">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit to track..."
              className="flex-1 bg-white/80 dark:bg-gray-700/80 border-purple-100 dark:border-gray-600 focus-visible:ring-primary/50 placeholder:text-purple-300 dark:placeholder:text-gray-500 backdrop-blur-sm dark:text-white"
              disabled={isLoading}
              ref={inputRef}
            />
            <Button 
              type="submit"
              className="bg-gradient-to-r from-primary via-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white shadow-md hover:shadow-lg transition-all duration-300 group"
              disabled={!newHabitName.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5 sm:mr-2 group-hover:rotate-90 transition-transform" />
                  <span className="hidden sm:inline">Add Habit</span>
                </>
              )}
            </Button>
          </form>
        </Card>
        
        {/* Motivational Quote */}
        {showQuote && (
          <div className="mt-6 relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xs"
              onClick={() => {
                setShowQuote(false);
                localStorage.setItem("showQuotes", "false");
              }}
            >
              Hide
            </button>
            <MotivationalQuote />
          </div>
        )}
        
        {/* Progress Timeline (only show if there are habits) */}
        {habits.length > 0 && (
          <div className="mt-6">
            <ProgressTimeline habits={habits} />
          </div>
        )}

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {habits.length === 0 ? (
            <EmptyState onAddHabit={focusInput} />
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onReset={() => resetHabit(habit.id)}
                onDeleteReset={(index) => handleDeleteReset(habit.id, index)}
                onAddCustomReset={(resetTime) => addCustomReset({ habitId: habit.id, resetTime })}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            ))
          )}
        </div>

        {/* Achievements Section */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="card-glass dark:bg-gray-800/90 dark:border-gray-700 animate-fade-in mt-6"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-6 hover:bg-purple-50/50 dark:hover:bg-gray-700/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-purple-500/20 group-hover:bg-primary/20 dark:group-hover:bg-purple-500/30 transition-colors">
                <Trophy className="h-6 w-6 text-primary dark:text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Achievements</span>
            </div>
            <span className="text-sm text-purple-400 dark:text-purple-300 font-medium">
              {isOpen ? "Hide" : "Show"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6 pt-0">
              <Achievements />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Milestone Celebration */}
      {primaryHabit && (
        <MilestoneConfetti 
          streak={currentStreak} 
          habitName={primaryHabit.name} 
        />
      )}
    </div>
  );
}
