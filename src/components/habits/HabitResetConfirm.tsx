import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface HabitResetConfirmProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function HabitResetConfirm({ onClose, onConfirm }: HabitResetConfirmProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
        <div className="grid gap-4 py-2">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Habit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to reset this habit? This will set your current streak back to 0.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Reset Habit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 