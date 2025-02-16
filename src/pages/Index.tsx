
import { useState } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { HabitCard } from '@/components/HabitCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const { habits, addHabit, resetHabit, removeReset, deleteHabit } = useHabits();
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </div>

        <div className="grid gap-4">
          {habits.map((habit) => (
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
            />
          ))}
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter habit name"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              />
              <Button className="w-full" onClick={handleAddHabit}>
                Add Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
