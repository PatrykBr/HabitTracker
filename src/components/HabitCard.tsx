
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatTimeSince } from '@/utils/format-time';
import { Clock, RotateCcw, History, Plus, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { Habit } from '@/hooks/use-habits';
import 'react-day-picker/dist/style.css';
import { addDays, subDays, startOfDay, format } from 'date-fns';

interface HabitCardProps {
  habit: Habit;
  onReset: () => void;
  onDeleteReset: (index: number) => void;
  onAddCustomReset?: (resetTime: Date) => void;
}

export function HabitCard({ habit, onReset, onDeleteReset, onAddCustomReset }: HabitCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReset, setShowAddReset] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const handleQuickReset = (daysAgo: number) => {
    if (onAddCustomReset) {
      const date = subDays(startOfDay(new Date()), daysAgo);
      onAddCustomReset(date);
      setShowAddReset(false);
    }
  };

  const handleAddCustomReset = () => {
    if (selectedDate && selectedTime && onAddCustomReset) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const resetDate = new Date(selectedDate);
      resetDate.setHours(hours, minutes);
      onAddCustomReset(resetDate);
      setShowAddReset(false);
    }
  };

  // Reset days for the calendar
  const resetDays = habit.resets.map(reset => new Date(reset));

  return (
    <>
      <Card className="w-full p-6 backdrop-blur-sm bg-white/90 hover:bg-white/95 transition-all duration-300 animate-fade-in">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{habit.name}</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeSince(habit.lastReset)}</span>
          </div>
          <Button
            className="w-full gap-2"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Now
          </Button>
        </div>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Reset History</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-secondary' : ''}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-secondary' : ''}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddReset(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Reset
            </Button>

            {viewMode === 'calendar' ? (
              <div className="flex justify-center p-4 bg-secondary/30 rounded-lg">
                <DayPicker
                  mode="multiple"
                  selected={resetDays}
                  footer={`${resetDays.length} resets total`}
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {habit.resets.map((reset, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded bg-secondary">
                    <span>{new Date(reset).toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteReset(index)}
                    >
                      Remove
                    </Button>
                  </div>
                )).reverse()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddReset} onOpenChange={setShowAddReset}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Reset Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Quick Reset Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Add</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleQuickReset(0)}
                  className="w-full"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickReset(1)}
                  className="w-full"
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickReset(2)}
                  className="w-full"
                >
                  2 Days Ago
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickReset(3)}
                  className="w-full"
                >
                  3 Days Ago
                </Button>
              </div>
            </div>

            {/* Custom Date/Time Picker */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Custom Date & Time</h4>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-center bg-secondary/30 rounded-lg p-4">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </div>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
                <Button onClick={handleAddCustomReset}>
                  Add Custom Reset
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
