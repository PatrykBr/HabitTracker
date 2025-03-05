import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatTimeSince } from '@/utils/format-time';
import { Clock, RotateCcw, History, Plus, CalendarDays, List, Trash2, Award, MoreHorizontal, Edit, AlertTriangle, X, Flame, Trophy, Calendar, GitBranch } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { Habit } from '@/hooks/use-habits';
import 'react-day-picker/dist/style.css';
import { format, startOfDay, set, differenceInDays } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HabitCardProps {
  habit: Habit;
  onReset: () => void;
  onDeleteReset: (index: number) => void;
  onAddCustomReset?: (resetTime: Date) => void;
  onEditHabit?: (id: string, newName: string) => void;
  onDeleteHabit?: (id: string) => void;
}

export function HabitCard({ 
  habit, 
  onReset, 
  onDeleteReset, 
  onAddCustomReset,
  onEditHabit,
  onDeleteHabit
}: HabitCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReset, setShowAddReset] = useState(false);
  const [showEditHabit, setShowEditHabit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [month, setMonth] = useState<Date>(startOfDay(new Date()));
  const [editedName, setEditedName] = useState(habit.name);
  const [showQuotes] = useState(() => {
    // Check if user has a preference stored for quotes
    const savedPreference = localStorage.getItem("showQuotes");
    // Default to true if no preference is set
    return savedPreference === null ? true : savedPreference === "true";
  });

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

  const handleEditHabit = () => {
    if (editedName.trim() && onEditHabit) {
      onEditHabit(habit.id, editedName.trim());
      setShowEditHabit(false);
    }
  };

  const handleDeleteHabit = () => {
    if (onDeleteHabit) {
      onDeleteHabit(habit.id);
      setShowDeleteConfirm(false);
    }
  };

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

  // Calculate streak visualization
  const currentStreakDays = differenceInDays(new Date(), new Date(habit.lastReset));
  const streakLevel = currentStreakDays <= 3 ? 'low' : 
                     currentStreakDays <= 7 ? 'medium' : 
                     currentStreakDays <= 14 ? 'high' : 'excellent';
  
  const streakColors = {
    low: 'bg-blue-100 dark:bg-blue-900/30',
    medium: 'bg-green-100 dark:bg-green-900/30',
    high: 'bg-purple-200 dark:bg-purple-900/30',
    excellent: 'bg-gradient-to-r from-purple-200 via-purple-300 to-blue-300 dark:from-purple-900/40 dark:via-purple-800/40 dark:to-blue-900/40'
  };

  const streakTextColors = {
    low: 'text-blue-600 dark:text-blue-400',
    medium: 'text-green-600 dark:text-green-400',
    high: 'text-purple-600 dark:text-purple-400',
    excellent: 'text-purple-700 dark:text-purple-300'
  };

  const streakBadgeColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    medium: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    high: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    excellent: 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300 dark:border-purple-800'
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

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

  return (
    <>
      <Card className={`group h-full backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 animate-fade-in border-0 dark:border-gray-700 shadow-sm hover:shadow-md overflow-hidden ${streakLevel === 'excellent' ? 'ring-2 ring-purple-200 dark:ring-purple-500/30' : ''}`}>
        <div className={`h-1.5 w-full ${streakColors[streakLevel]}`}></div>
        <div className="flex flex-col gap-3 sm:gap-4 h-full p-3 sm:p-5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{habit.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${streakBadgeColors[streakLevel]}`}>
                  <Award className="h-3 w-3 mr-1" />
                  {currentStreakDays} day streak
                </Badge>
                {currentStreakDays > 0 && showQuotes && (
                  <div className={`mt-1 px-2 py-1 rounded-md bg-gradient-to-r from-${streakLevel === 'excellent' ? 'purple-50' : 'blue-50'} to-transparent dark:from-${streakLevel === 'excellent' ? 'purple-900/20' : 'blue-900/20'} dark:to-transparent`}>
                    <span className={`text-xs font-medium ${streakTextColors[streakLevel]} flex items-center`}>
                      <Flame className="h-3 w-3 mr-1.5" />
                      Don't break the chain!
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-70 group-hover:opacity-100 transition-opacity -mr-2 dark:text-gray-300 dark:hover:bg-gray-700">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem onClick={() => setShowHistory(true)} className="dark:text-gray-300 dark:focus:bg-gray-700">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAddReset(true)} className="dark:text-gray-300 dark:focus:bg-gray-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Reset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditHabit(true)} className="dark:text-gray-300 dark:focus:bg-gray-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Habit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Habit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2.5 mt-1 mb-1">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-700/50">
              <Clock className={`h-4.5 w-4.5 ${streakTextColors[streakLevel]}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Time since last reset</span>
              <span className={`text-base font-semibold ${streakTextColors[streakLevel]}`}>{formatTimeSince(habit.lastReset)}</span>
            </div>
          </div>
          
          {/* Streak Visualization */}
          <div className="mt-2 mb-1">
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${streakColors[streakLevel]} transition-all duration-500`} 
                style={{ width: `${Math.min(currentStreakDays * 3, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>0</span>
              <span>7</span>
              <span>14</span>
              <span>30+</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:gap-3 mt-auto">
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 dark:hover:text-red-300"
                      onClick={handleResetClick}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This will reset your streak to 0!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
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
                onClick={() => setShowAddReset(true)}
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
                              <Clock className="h-3 w-3 text-blue-700 dark:text-blue-400 mr-1" />
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
                              <CalendarDays className="h-3 w-3 text-purple-700 dark:text-purple-400 mr-1" />
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
                        
                        {/* Heatmap visualization - Made more compact */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700 p-2">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                              Reset Frequency
                            </h3>
                            <div className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
                              <div className="w-1.5 h-1.5 rounded-sm bg-red-200 dark:bg-red-800/40"></div>
                              <div className="w-1.5 h-1.5 rounded-sm bg-red-400 dark:bg-red-600/60"></div>
                              <div className="w-1.5 h-1.5 rounded-sm bg-red-500 dark:bg-red-500/70"></div>
                              <span className="text-[8px] text-gray-500 dark:text-gray-400 ml-0.5">More</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-0.5">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                              <div key={i} className="text-[9px] text-center text-gray-500 dark:text-gray-400 font-medium">
                                {day}
                              </div>
                            ))}
                            {(() => {
                              // Count resets by day of week
                              const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
                              resetDays.forEach(date => {
                                dayCount[date.getDay()]++;
                              });
                              
                              // Find max for scaling
                              const maxCount = Math.max(...dayCount);
                              
                              return dayCount.map((count, i) => {
                                // Calculate color intensity based on count
                                let bgColor = 'bg-gray-100 dark:bg-gray-700';
                                if (count > 0) {
                                  const intensity = Math.ceil((count / maxCount) * 5);
                                  const lightClass = `bg-red-${intensity * 100}`;
                                  const darkClass = `dark:bg-red-${900 - intensity * 100}/${30 + intensity * 10}`;
                                  bgColor = `${lightClass} ${darkClass}`;
                                }
                                
                                return (
                                  <div 
                                    key={i} 
                                    className={`h-6 rounded-md ${bgColor} flex items-center justify-center`}
                                    title={`${count} resets on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}`}
                                  >
                                    {count > 0 && (
                                      <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                                        {count}
                                      </span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[120px] text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-1.5">
                          <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">No reset data yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowAddReset(true)}
                          className="mt-1 h-6 text-[10px] px-2"
                        >
                          <Plus className="h-2.5 w-2.5 mr-1" />
                          Add Reset
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* List View */}
                {viewMode === ('list' as const) && (
                  <div className="p-2 max-h-[calc(100vh-150px)] overflow-y-auto">
                    {habit.resets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <CalendarDays className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No resets recorded yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowAddReset(true)}
                          className="mt-3"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Reset
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const groupedResets = {};
                          
                          [...habit.resets]
                            .sort((a, b) => b.getTime() - a.getTime())
                            .forEach(reset => {
                              const monthYear = format(reset, 'MMMM yyyy');
                              
                              if (!groupedResets[monthYear]) {
                                groupedResets[monthYear] = [];
                              }
                              
                              groupedResets[monthYear].push(reset);
                            });
                            
                          return Object.entries(groupedResets).map(([monthYear, dates]) => (
                            <div key={monthYear} className="mb-4">
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                                {monthYear}
                              </h3>
                              <div className="space-y-2">
                                {(dates as Date[]).map((resetDate, index) => {
                                  const isToday = new Date().toDateString() === resetDate.toDateString();
                                  const isYesterday = new Date(Date.now() - 86400000).toDateString() === resetDate.toDateString();
                                  
                                  let dateLabel = format(resetDate, 'd');
                                  let dayName = format(resetDate, 'EEEE');
                                  
                                  if (isToday) dayName = 'Today';
                                  if (isYesterday) dayName = 'Yesterday';
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700 flex items-center"
                                    >
                                      <div className="w-12 h-full bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center py-3 border-r dark:border-gray-700">
                                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{dateLabel}</span>
                                      </div>
                                      <div className="flex-1 p-3 flex justify-between items-center">
                                        <div>
                                          <div className="text-sm font-medium dark:text-gray-200">{dayName}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {format(resetDate, 'h:mm a')}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => onDeleteReset(habit.resets.indexOf(resetDate))}
                                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline View */}
                {viewMode === ('timeline' as const) && (
                  <div className="p-2 max-h-[calc(100vh-150px)] overflow-y-auto">
                    {streakPeriods.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <History className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No streak data available</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6 py-2">
                        {[...streakPeriods].reverse().map((period, index) => {
                          // Determine color based on streak length
                          let dotColor = 'bg-gray-400 dark:bg-gray-600';
                          let badgeColor = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
                          let icon = null;
                          
                          if (period.isCurrent) {
                            dotColor = 'bg-green-500';
                            badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                            icon = <Flame className="h-3 w-3 mr-1" />;
                          } else if (period.days >= 30) {
                            dotColor = 'bg-purple-500';
                            badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
                            icon = <Trophy className="h-3 w-3 mr-1" />;
                          } else if (period.days >= 7) {
                            dotColor = 'bg-blue-500';
                            badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
                            icon = <Award className="h-3 w-3 mr-1" />;
                          }
                          
                          return (
                            <div key={index} className="relative">
                              <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full ${dotColor} flex items-center justify-center shadow-sm`}>
                                {period.isCurrent ? (
                                  <Flame className="h-3 w-3 text-white" />
                                ) : period.days >= 7 ? (
                                  <Award className="h-3 w-3 text-white" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                                <div className="p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium dark:text-gray-200 flex items-center">
                                      {period.isCurrent ? 'Current Streak' : 'Past Streak'}
                                      <Badge className={`ml-2 ${badgeColor}`}>
                                        {icon}
                                        {period.days} {period.days === 1 ? 'day' : 'days'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                    {format(period.start, 'MMM d, yyyy')} 
                                    <span className="mx-1">—</span> 
                                    {period.isCurrent ? 'Present' : format(period.end, 'MMM d, yyyy')}
                                  </div>
                                  
                                  {period.days >= 7 && !period.isCurrent && showQuotes && (
                                    <div className="mt-2 p-1.5 rounded-md bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                                      <Award className="h-3.5 w-3.5 mr-1.5" />
                                      <span className="font-medium">Great streak!</span> You maintained this habit for over a week.
                                    </div>
                                  )}
                                  
                                  {period.days >= 30 && !period.isCurrent && showQuotes && (
                                    <div className="mt-2 p-1.5 rounded-md bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-xs text-purple-600 dark:text-purple-400 flex items-center">
                                      <Trophy className="h-3.5 w-3.5 mr-1.5" />
                                      <span className="font-medium">Impressive!</span> This was a 30+ day streak.
                                    </div>
                                  )}
                                  
                                  {period.isCurrent && period.days >= 3 && showQuotes && (
                                    <div className="mt-2 p-1.5 rounded-md bg-green-50/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-xs text-green-600 dark:text-green-400 flex items-center">
                                      <Flame className="h-3.5 w-3.5 mr-1.5" />
                                      <span className="font-medium">You're doing great!</span> Keep going!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reset Dialog */}
      <Dialog open={showAddReset} onOpenChange={setShowAddReset}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[425px] max-h-[calc(100vh-64px)] overflow-y-auto p-0 dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader className="p-4 border-b dark:border-gray-700">
            <DialogTitle className="dark:text-gray-200">Add Custom Reset</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="flex gap-2 mb-4">
              <Select onValueChange={handleMonthSelect} value={months[month.getMonth()]}>
                <SelectTrigger className="w-[140px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={handleYearSelect} value={month.getFullYear().toString()}>
                <SelectTrigger className="w-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/30 dark:bg-gray-700/30 rounded-lg p-2 sm:p-4 flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(startOfDay(date))}
                month={month}
                onMonthChange={setMonth}
                fromDate={new Date(0)}
                toDate={new Date()}
                fixedWeeks
                weekStartsOn={0}
                showOutsideDays
                captionLayout="buttons"
                classNames={{
                  months: "flex justify-center",
                  month: "w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium dark:text-gray-300",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex justify-center",
                  head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.8rem] sm:text-sm dark:text-gray-400",
                  row: "flex w-full mt-1 justify-center",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-300 dark:hover:bg-gray-700",
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
              <Button variant="outline" onClick={() => setShowAddReset(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancel
              </Button>
              <Button onClick={handleAddCustomReset}>
                Add Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog open={showEditHabit} onOpenChange={setShowEditHabit}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-200">Edit Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="habitName" className="text-sm font-medium dark:text-gray-300">
                Habit Name
              </label>
              <Input
                id="habitName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter habit name"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditHabit(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancel
              </Button>
              <Button onClick={handleEditHabit} disabled={!editedName.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Habit
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{habit.name}"? This action cannot be undone and all history will be lost.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteHabit}>
                Delete Habit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reset Your Streak?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-3">
              <p className="text-gray-700">
                Are you sure you want to reset your streak for <strong>{habit.name}</strong>?
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-amber-800 text-sm">
                  <strong>Warning:</strong> This will reset your current streak of <strong className={streakTextColors[streakLevel]}>{currentStreakDays} days</strong> back to zero. This action cannot be undone.
                </p>
              </div>
              
              {currentStreakDays > 7 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">
                    <strong>You'll lose your {currentStreakDays}-day streak!</strong> Consider if there's another way to maintain your progress.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Yes, Reset Streak
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
