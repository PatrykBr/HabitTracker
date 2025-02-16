
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings, Trophy, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-[linear-gradient(109.6deg,rgba(223,234,247,1)_11.2%,rgba(244,248,252,1)_91.1%)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700" />
        </div>

        {/* Header Section */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-primary to-blue-600 tracking-tight">
              Habit Tracker
            </h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="bg-white/80 hover:bg-purple-50 transition-all duration-300 border-purple-100 backdrop-blur-sm"
            >
              <BarChart2 className="h-5 w-5 text-primary" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="bg-white/80 hover:bg-purple-50 transition-all duration-300 border-purple-100 backdrop-blur-sm"
            >
              <Settings className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="relative p-6 bg-white/90 backdrop-blur-sm border border-purple-100 shadow-lg shadow-purple-100/20 hover:shadow-purple-100/30 transition-all duration-300 animate-fade-in rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 opacity-80" />
          <form onSubmit={handleAddHabit} className="relative flex gap-3">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit to track..."
              className="flex-1 bg-white/80 border-purple-100 focus-visible:ring-primary/50 placeholder:text-purple-300 backdrop-blur-sm"
            />
            <Button 
              type="submit"
              className="bg-gradient-to-r from-primary via-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
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
            <Card className="col-span-full p-12 bg-white/90 backdrop-blur-sm border-2 border-dashed border-purple-200 rounded-xl">
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
          className="rounded-xl overflow-hidden bg-white/90 backdrop-blur-sm border border-purple-100 shadow-lg shadow-purple-100/20 transition-all duration-300 animate-fade-in"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-6 hover:bg-purple-50/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-6 w-6 text-primary" />
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
