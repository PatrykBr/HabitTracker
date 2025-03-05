import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Habit } from '@/types/habits/habit.types';

interface HabitDeleteConfirmProps {
  habit: Habit;
  onClose: () => void;
  onDeleteHabit?: (id: string) => void;
}

export function HabitDeleteConfirm({ habit, onClose, onDeleteHabit }: HabitDeleteConfirmProps) {
  const handleDeleteHabit = () => {
    if (onDeleteHabit) {
      onDeleteHabit(habit.id);
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
        <div className="grid gap-4 py-2">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Habit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{habit.name}"? This action cannot be undone and all history will be lost.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHabit}>
              Delete Habit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 