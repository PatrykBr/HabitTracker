
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
import { format, startOfDay, set } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HabitCardProps {
  habit: Habit;
  onReset: () => void;
  onDeleteReset: (index: number) => void;
  onAddCustomReset?: (resetTime: Date) => void;
}

export function HabitCard({ habit, onReset, onDeleteReset, onAddCustomReset }: HabitCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReset, setShowAddReset] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [month, setMonth] = useState<Date>(startOfDay(new Date()));

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearSelect = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(startOfDay(newDate));
  };

  const handleMonthSelect = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    const newDate = new Date(month);
    newDate.setMonth(monthIndex);
    setMonth(startOfDay(newDate));
  };

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
      setShowAddReset(false);
    }
  };

  // Ensure all reset dates are properly handled for display
  const resetDays = habit.resets.map(reset => startOfDay(new Date(reset)));

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
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[600px] max-h-[calc(100vh-64px)] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex flex-col gap-3">
              <DialogTitle>History for "{habit.name}"</DialogTitle>
              <div className="flex flex-wrap gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setShowAddReset(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reset
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'calendar' ? (
              <div className="flex justify-center p-4 bg-secondary/30 rounded-lg">
                <DayPicker
                  mode="multiple"
                  selected={resetDays}
                  footer={`${resetDays.length} resets total`}
                  month={month}
                  onMonthChange={setMonth}
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    head_cell: "text-xs sm:text-sm",
                    caption: "text-sm sm:text-base",
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {habit.resets.map((reset, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className="text-xs sm:text-sm">{new Date(reset).toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteReset(index)}
                      className="text-destructive hover:bg-destructive/10 shrink-0"
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
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[425px] max-h-[calc(100vh-64px)] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Add Custom Reset</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="flex gap-2 mb-4">
              <Select onValueChange={handleMonthSelect} defaultValue={months[month.getMonth()]}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={handleYearSelect} defaultValue={month.getFullYear().toString()}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/30 rounded-lg p-2 sm:p-4 flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(startOfDay(date))}
                month={month}
                onMonthChange={setMonth}
                initialFocus
                className="!w-full !m-0"
                classNames={{
                  months: "flex justify-center",
                  month: "w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex justify-center",
                  head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.8rem] sm:text-sm",
                  row: "flex w-full mt-1 justify-center",
                  cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-secondary rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium">
                Time
              </label>
              <div className="flex gap-2">
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-white/50 flex-1"
                />
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white shrink-0"
                  onClick={handleAddCustomReset}
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
