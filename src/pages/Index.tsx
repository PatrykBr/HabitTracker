
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings, Trophy } from "lucide-react";
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

export default function Index() {
  const [newHabitName, setNewHabitName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { habits, addHabit, resetHabit, addCustomReset, removeReset, deleteHabit } = useHabits();
  const navigate = useNavigate();

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      await addHabit(newHabitName.trim());
      setNewHabitName("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 via-white to-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Habit Tracker
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="hover:bg-secondary/80 transition-colors duration-200"
            >
              <BarChart2 className="h-5 w-5 text-primary" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="hover:bg-secondary/80 transition-colors duration-200"
            >
              <Settings className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="p-4 sm:p-5 bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <form onSubmit={handleAddHabit} className="flex gap-3">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit to track..."
              className="flex-1 bg-white/50 border-secondary focus-visible:ring-primary"
            />
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={!newHabitName.trim()}
            >
              <Plus className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Add Habit</span>
            </Button>
          </form>
        </Card>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
          {habits.length === 0 ? (
            <Card className="col-span-full p-8 bg-white/80 backdrop-blur-sm border-dashed border-2 border-secondary">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-700">No habits yet</p>
                <p className="text-sm text-muted-foreground">
                  Start by adding your first habit above! 🌟
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
          className="rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm border shadow-sm transition-all duration-200"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-semibold text-gray-700">Achievements</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isOpen ? "Hide" : "Show"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">
              <Achievements />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
