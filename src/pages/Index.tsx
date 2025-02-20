
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings, Sparkles } from "lucide-react";
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
          title: "Success",
          description: "New habit added",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add habit",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              Habit Tracker
            </h1>
            <Sparkles className="h-5 w-5 text-primary/70" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
              className="glass hover:bg-white/95"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="glass hover:bg-white/95"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add Habit Form */}
        <Card className="glass p-4 sm:p-6">
          <form onSubmit={handleAddHabit} className="flex gap-3">
            <Input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter a new habit..."
              className="flex-1 bg-white/50 border-0 focus-visible:ring-1"
              disabled={isLoading}
            />
            <Button 
              type="submit"
              disabled={!newHabitName.trim() || isLoading}
              className="bg-primary/90 hover:bg-primary text-white shadow-none hover:shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Habit</span>
            </Button>
          </form>
        </Card>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {habits.length === 0 ? (
            <Card className="col-span-full p-12 glass text-center">
              <div className="space-y-3">
                <div className="inline-block p-3 bg-primary/5 rounded-full">
                  <Plus className="h-6 w-6 text-primary/70" />
                </div>
                <p className="text-lg font-light text-gray-600">No habits yet</p>
                <p className="text-sm text-gray-400">
                  Start by adding your first habit above
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

        {/* Achievements */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="glass rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-white/50 transition-colors">
            <span className="text-lg font-light text-gray-700">Achievements</span>
            <span className="text-sm text-gray-400">
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
