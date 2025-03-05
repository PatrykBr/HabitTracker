import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Habit } from '@/types/habits/habit.types';

interface HabitEditFormProps {
  habit: Habit;
  onClose: () => void;
  onEditHabit?: (id: string, newName: string) => void;
}

export function HabitEditForm({ habit, onClose, onEditHabit }: HabitEditFormProps) {
  const [editedName, setEditedName] = useState(habit.name);

  const handleEditHabit = () => {
    if (editedName.trim() && onEditHabit) {
      onEditHabit(habit.id, editedName.trim());
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Habit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Change the name of your habit.
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium dark:text-gray-300">
              Habit Name
            </label>
            <Input
              id="name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="bg-white border shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              placeholder="Enter habit name"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleEditHabit} disabled={!editedName.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 