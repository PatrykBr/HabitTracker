import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Habit } from '@/types/habits/habit.types';
import { format, startOfDay, differenceInDays, subDays, addDays, isAfter, isBefore } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar, GitBranch, List, Plus, Flame, CheckCircle2, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HabitHistoryProps {
  habit: Habit;
  onClose: () => void;
  onDeleteReset: (index: number) => void;
  onAddCustomReset?: (resetTime: Date) => void;
}

export function HabitHistory({ habit, onClose, onDeleteReset, onAddCustomReset }: HabitHistoryProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [month, setMonth] = useState<Date>(startOfDay(new Date()));
  
  // Ensure all reset dates are properly handled for display
  const resetDays = habit.resets.map(reset => startOfDay(new Date(reset)));
  
  // Sort resets chronologically for timeline view
  const sortedResets = [...habit.resets]
    .map(reset => new Date(reset))
    .sort((a, b) => a.getTime() - b.getTime());

  // Calculate streak periods for timeline visualization
  const streakPeriods = [];
  // Use the first reset date or current date if no resets/createdAt
  let currentStart = sortedResets.length > 0 
    ? new Date(habit.lastReset) 
    : new Date(Date.now() - 86400000); // Default to yesterday if no resets
  
  if (sortedResets.length > 0) {
    for (let i = 0; i < sortedResets.length; i++) {
      const resetDate = sortedResets[i];
      streakPeriods.push({
        start: new Date(currentStart),
        end: new Date(resetDate),
        days: differenceInDays(resetDate, currentStart)
      });
      currentStart = resetDate;
    }
  }
  
  // Add current streak
  streakPeriods.push({
    start: new Date(currentStart),
    end: new Date(),
    days: differenceInDays(new Date(), currentStart),
    isCurrent: true
  });

  // Calculate current streak
  const currentStreakDays = differenceInDays(new Date(), new Date(habit.lastReset));

  // Helper functions for calendar insights
  function getMostCommonDay(dates) {
    if (!dates.length) return null;
    
    const dayCounts: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    dates.forEach(date => {
      const day = date.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommonDay = null;
    
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonDay = dayNames[parseInt(day, 10)];
      }
    });
    
    return mostCommonDay;
  }

  function getAverageDaysBetweenResets(dates) {
    if (dates.length < 2) return 'N/A';
    
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += differenceInDays(dates[i], dates[i-1]);
    }
    
    const average = totalDays / (dates.length - 1);
    return average.toFixed(1);
  }

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

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-[500px] max-h-[calc(100vh-64px)] flex flex-col overflow-hidden p-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="flex flex-col items-center gap-3 p-3 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('calendar' as const)}
              className={`h-8 w-8 rounded-full ${viewMode === ('calendar' as const) ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title="Calendar View"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('timeline' as const)}
              className={`h-8 w-8 rounded-full ${viewMode === ('timeline' as const) ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title="Timeline View"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list' as const)}
              className={`h-8 w-8 rounded-full ${viewMode === ('list' as const) ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddCustomReset && onClose()}
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-primary"
              title="Add Reset"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
              <div>
                <h2 className="text-base font-medium dark:text-gray-200">{habit.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {resetDays.length} {resetDays.length === 1 ? 'reset' : 'resets'} • Current streak: {currentStreakDays} {currentStreakDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
              {/* Calendar View */}
              {viewMode === ('calendar' as const) && (
                <div className="p-2 max-h-[calc(100vh-150px)] overflow-y-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700 mb-2">
                    <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                      <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Reset Calendar
                      </h3>
                      <div className="flex gap-1">
                        <Select onValueChange={handleMonthSelect} value={months[month.getMonth()]}>
                          <SelectTrigger className="w-[100px] h-7 text-xs">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month} value={month} className="text-xs">
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select onValueChange={handleYearSelect} value={month.getFullYear().toString()}>
                          <SelectTrigger className="w-[70px] h-7 text-xs">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()} className="text-xs">
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="p-2">
                      <DayPicker
                        mode="multiple"
                        selected={resetDays}
                        month={month}
                        onMonthChange={handleMonthChange}
                        showOutsideDays={true}
                        fixedWeeks={true}
                        modifiers={{
                          selected: resetDays
                        }}
                        modifiersStyles={{
                          selected: {
                            backgroundColor: '#ef4444',
                            color: 'white',
                            boxShadow: '0 1px 3px rgba(239, 68, 68, 0.2)'
                          }
                        }}
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-1",
                          caption: "flex justify-center relative items-center text-xs mb-1",
                          caption_label: "font-medium text-gray-700 dark:text-gray-300",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-5 w-5 bg-transparent flex items-center justify-center rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex justify-between w-full",
                          head_cell: "text-[10px] w-6 font-medium text-center text-gray-500 dark:text-gray-400",
                          row: "flex justify-between w-full mt-1",
                          cell: "relative p-0 text-center text-xs rounded-md w-6",
                          day: "h-6 w-6 p-0 font-normal rounded-md flex items-center justify-center text-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                          day_selected: "bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600",
                          day_today: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium",
                          day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                          day_disabled: "text-gray-400 dark:text-gray-600 opacity-50",
                          day_hidden: "invisible",
                          root: "p-0"
                        }}
                        styles={{
                          caption: { position: 'relative' }
                        }}
                      />
                    </div>
                  </div>

                  {resetDays.length > 0 ? (
                    <>
                      {/* Stats cards - Moved above heatmap and made more compact */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                          <div className="p-1 border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center">
                            <Calendar className="h-3 w-3 text-blue-700 dark:text-blue-400 mr-1" />
                            <h4 className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Common</h4>
                          </div>
                          <div className="p-1.5 flex flex-col items-center justify-center">
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {getMostCommonDay(resetDays) ? getMostCommonDay(resetDays).substring(0, 3) : 'N/A'}
                            </div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
                              Day
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                          <div className="p-1 border-b dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 flex items-center">
                            <Calendar className="h-3 w-3 text-purple-700 dark:text-purple-400 mr-1" />
                            <h4 className="text-[10px] font-medium text-purple-700 dark:text-purple-400">Avg</h4>
                          </div>
                          <div className="p-1.5 flex flex-col items-center justify-center">
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {resetDays.length >= 3 ? `${getAverageDaysBetweenResets(sortedResets)}d` : 'N/A'}
                            </div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
                              Streak
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                          <div className="p-1 border-b dark:border-gray-700 bg-green-50 dark:bg-green-900/20 flex items-center">
                            <Flame className="h-3 w-3 text-green-700 dark:text-green-400 mr-1" />
                            <h4 className="text-[10px] font-medium text-green-700 dark:text-green-400">Current</h4>
                          </div>
                          <div className="p-1.5 flex flex-col items-center justify-center">
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {currentStreakDays}d
                            </div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
                              Streak
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                      No resets recorded yet.
                    </div>
                  )}
                </div>
              )}

              {/* Timeline View */}
              {viewMode === ('timeline' as const) && (
                <div className="p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                  <div className="space-y-3">
                    {streakPeriods.map((period, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                        <div className={`p-2 border-b dark:border-gray-700 ${
                          period.isCurrent 
                            ? 'bg-green-50 dark:bg-green-900/20' 
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        } flex justify-between items-center`}>
                          <h3 className={`text-xs font-medium ${
                            period.isCurrent 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {period.isCurrent ? 'Current Streak' : `Streak ${streakPeriods.length - index}`}
                          </h3>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {period.days} {period.days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Start</span>
                              <span>{format(period.start, 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex-1 mx-2 h-0.5 bg-gray-100 dark:bg-gray-700 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-white dark:bg-gray-800 px-2 text-[10px] font-medium">
                                  {period.days} days
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300">End</span>
                              <span>{period.isCurrent ? 'Now' : format(period.end, 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* List View */}
              {viewMode === ('list' as const) && (
                <div className="p-2 max-h-[calc(100vh-150px)] overflow-y-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                    <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Reset History
                      </h3>
                    </div>
                    <div className="divide-y dark:divide-gray-700">
                      {sortedResets.length > 0 ? (
                        sortedResets.map((reset, index) => (
                          <div key={index} className="p-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Reset #{sortedResets.length - index}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(reset, 'MMMM d, yyyy')} at {format(reset, 'h:mm a')}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onDeleteReset(index)}
                              className="h-7 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No resets recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 