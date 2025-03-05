import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay, set } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface HabitResetFormProps {
  onClose: () => void;
  onAddCustomReset?: (resetTime: Date) => void;
}

export function HabitResetForm({ onClose, onAddCustomReset }: HabitResetFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));

  const handleAddCustomReset = () => {
    if (selectedDate && selectedTime && onAddCustomReset) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const resetDate = set(selectedDate, {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0
      });
      onAddCustomReset(resetDate);
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Custom Reset</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a date and time for when you reset this habit.
            </p>
          </div>

          <div className="flex justify-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ after: new Date() }}
              classNames={{
                months: "flex flex-col",
                month: "space-y-4",
                caption: "flex justify-center relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-300 dark:hover:bg-gray-700",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
                root: "dark:text-gray-300",
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="time" className="text-sm font-medium dark:text-gray-300">Time</label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-white border shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddCustomReset}>
              Add Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 