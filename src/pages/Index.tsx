
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/hooks/use-habits";
import { HabitCard } from "@/components/HabitCard";
import { Input } from "@/components/ui/input";
import { Achievements } from "@/components/Achievements";

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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/statistics")}
            >
              <BarChart2 className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleAddHabit} className="flex gap-2">
          <Input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Enter a new habit..."
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="h-5 w-5" />
          </Button>
        </form>

        <Achievements />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onReset={() => resetHabit(habit.id)}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
