
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-primary to-blue-600">
            Habit Tracker
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="hover:bg-purple-50 transition-all duration-300 border-purple-100"
            >
              <BarChart2 className="h-5 w-5 text-primary" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="hover:bg-purple-50 transition-all duration-300 border-purple-100"
            >
              <Settings className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg shadow-purple-100/20 hover:shadow-purple-100/30 transition-all duration-300 animate-fade-in">
          <form onSubmit={handleAddHabit} className="flex gap-3">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit to track..."
              className="flex-1 bg-white/50 border-purple-100 focus-visible:ring-primary/50 placeholder:text-purple-300"
            />
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              disabled={!newHabitName.trim()}
            >
              <Plus className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Add Habit</span>
            </Button>
          </form>
        </Card>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {habits.length === 0 ? (
            <Card className="col-span-full p-12 bg-white/80 backdrop-blur-sm border-2 border-dashed border-purple-200">
              <div className="text-center space-y-3">
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
          className="rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg shadow-purple-100/20 transition-all duration-300 animate-fade-in"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-6 hover:bg-purple-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
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
