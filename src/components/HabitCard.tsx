import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatTimeSince } from '@/utils/format-time';
import { Clock, RotateCcw, History, Plus, CalendarDays, List, Trash2 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { Habit } from '@/hooks/use-habits';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const handleAddCustomReset = () => {
    if (selectedDate && selectedTime && onAddCustomReset) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const resetDate = new Date(selectedDate);
      resetDate.setHours(hours, minutes);
      onAddCustomReset(resetDate);
      setShowAddReset(false);
    }
  };

  const resetDays = habit.resets.map(reset => new Date(reset));

  return (
    <>
      <Card className="group h-full p-3 sm:p-5 backdrop-blur-sm bg-white/90 hover:bg-white/95 transition-all duration-300 animate-fade-in border-0 shadow-sm hover:shadow-md">
        <div className="flex flex-col gap-3 sm:gap-4 h-full">
          <div className="flex justify-between items-start">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">{habit.name}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(true)}
              className="opacity-70 group-hover:opacity-100 transition-opacity -mr-2"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTimeSince(habit.lastReset)}</span>
          </div>
          
          <div className="mt-auto pt-2">
            <Button
              className="w-full gap-2 text-sm bg-primary hover:bg-primary/90 text-white"
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Now
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[600px] max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <div className="flex justify-between items-center mb-4">
              <DialogTitle>History for "{habit.name}"</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-secondary' : ''}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant="outline"
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
              className="w-full hover:bg-secondary/50"
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
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {habit.resets.map((reset, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className="text-sm">{new Date(reset).toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteReset(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )).reverse()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddReset} onOpenChange={setShowAddReset}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add Custom Reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center bg-secondary/30 rounded-lg p-4">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time
                </label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-white/50"
                />
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleAddCustomReset}
              >
                Add Custom Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
