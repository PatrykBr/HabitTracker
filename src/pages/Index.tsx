
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/hooks/use-habits";
import { HabitCard } from "@/components/HabitCard";
import { Input } from "@/components/ui/input";
import { Achievements } from "@/components/Achievements";
import { Card } from "@/components/ui/card";

export default function Index() {
  const [newHabitName, setNewHabitName] = useState("");
  const { habits, addHabit, resetHabit, deleteHabit } = useHabits();
  const navigate = useNavigate();

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      await addHabit(newHabitName.trim());
      setNewHabitName("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 to-white overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Habit Tracker
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="hover:bg-secondary transition-colors duration-200"
            >
              <BarChart2 className="h-5 w-5 text-accent" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="hover:bg-secondary transition-colors duration-200"
            >
              <Settings className="h-5 w-5 text-accent" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="p-3 sm:p-4 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleAddHabit} className="flex gap-2 sm:gap-3">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="What habit would you like to track?"
              className="flex-1 bg-white/50 border-secondary focus-visible:ring-primary text-sm sm:text-base"
            />
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white shrink-0"
            >
              <Plus className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </form>
        </Card>

        {/* Achievements Section */}
        <div className="rounded-lg overflow-hidden">
          <Achievements />
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {habits.length === 0 ? (
            <Card className="col-span-full p-6 sm:p-8 text-center bg-white/80 backdrop-blur-sm border-dashed border-2 border-secondary">
              <p className="text-muted-foreground">
                Start by adding your first habit above! 🌟
              </p>
            </Card>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onReset={() => resetHabit(habit.id)}
                onDeleteReset={(index) => {
                  console.log('Delete reset at index:', index);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
