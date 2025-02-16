
import { useState } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { HabitCard } from '@/components/HabitCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const { habits, addHabit, resetHabit, removeReset, deleteHabit, addCustomReset } = useHabits();
  const { toast } = useToast();

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim());
      setNewHabitName('');
      setShowAddDialog(false);
      toast({
        title: "Habit created",
        description: `${newHabitName} has been added to your habits.`,
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#f1f0fb] to-white">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Habit Tracker
            </h1>
            <p className="text-muted-foreground mt-1">Track and maintain your daily habits</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </div>

        <div className="grid gap-6">
          {habits.length === 0 ? (
            <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-lg">
              <p className="text-muted-foreground">No habits yet. Start by adding a new habit!</p>
            </div>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onReset={() => {
                  resetHabit(habit.id);
                  toast({
                    title: "Progress reset",
                    description: `${habit.name} progress has been reset.`,
                  });
                }}
                onDeleteReset={(index) => {
                  removeReset(habit.id, index);
                  toast({
                    title: "Reset removed",
                    description: "The reset entry has been removed from history.",
                  });
                }}
                onAddCustomReset={(resetTime) => {
                  addCustomReset({ habitId: habit.id, resetTime });
                  toast({
                    title: "Custom reset added",
                    description: `A custom reset time has been added to ${habit.name}.`,
                  });
                }}
              />
            ))
          )}
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription>
                Add a new habit to track. What would you like to maintain or improve?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter habit name..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                className="focus:ring-2 focus:ring-primary"
              />
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleAddHabit}
              >
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
