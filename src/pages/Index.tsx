
import { useEffect, useState } from "react";
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

export default function Index() {
  const [newHabitName, setNewHabitName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { habits, addHabit, resetHabit, addCustomReset, removeReset, deleteHabit } = useHabits();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      setIsLoading(true);
      try {
        await addHabit(newHabitName.trim());
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

  return (
    <div className="page-container">
      <div className="content-container">
        {/* Header Section */}
        <div className="page-header">
          <div className="title-container">
            <h1 className="page-title">Habit Tracker</h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="bg-white/80 hover:bg-purple-50 transition-all duration-300 border-purple-100 backdrop-blur-sm group"
            >
              <BarChart2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="bg-white/80 hover:bg-purple-50 transition-all duration-300 border-purple-100 backdrop-blur-sm group"
            >
              <Settings className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="card-glass">
          <form onSubmit={handleAddHabit} className="flex gap-3 p-6">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit to track..."
              className="flex-1 bg-white/80 border-purple-100 focus-visible:ring-primary/50 placeholder:text-purple-300 backdrop-blur-sm"
              disabled={isLoading}
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

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.length === 0 ? (
            <Card className="col-span-full p-12 card-glass">
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-purple-50 rounded-full">
                  <Plus className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="text-xl font-medium text-gray-700">No habits yet</p>
                <p className="text-sm text-purple-400">
                  Start by adding your first habit above! ✨
                </p>
              </div>
            </Card>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onReset={() => resetHabit(habit.id)}
                onDeleteReset={(index) => removeReset(habit.id, index)}
                onAddCustomReset={(resetTime) => addCustomReset({ habitId: habit.id, resetTime })}
              />
            ))
          )}
        </div>

        {/* Achievements Section */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="card-glass animate-fade-in"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-6 hover:bg-purple-50/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-lg font-semibold text-gray-700">Achievements</span>
            </div>
            <span className="text-sm text-purple-400 font-medium">
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
    </div>
  );
}
