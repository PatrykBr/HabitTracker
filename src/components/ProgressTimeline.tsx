import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HabitType } from '@/hooks/use-habits';
import { format, subDays, differenceInDays, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// CSS for the custom grid columns
const gridColsStyle = `
  .grid-cols-30 {
    grid-template-columns: repeat(30, minmax(0, 1fr));
  }
`;

interface ProgressTimelineProps {
  habits: HabitType[];
}

export function ProgressTimeline({ habits }: ProgressTimelineProps) {
  // Responsive time ranges for different screen sizes
  const [timeRange, setTimeRange] = useState<number>(30); // Default for large screens
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Adjust time range based on screen size
  useEffect(() => {
    let newTimeRange = 30; // Default for large screens (md and up)
    
    if (windowWidth < 640) {
      newTimeRange = 10; // Small mobile screens
    } else if (windowWidth < 768) {
      newTimeRange = 15; // Larger mobile screens
    } else if (windowWidth < 1024) {
      newTimeRange = 20; // Tablet screens
    }
    
    setTimeRange(newTimeRange);
    // Adjust start date to show the most recent days by default
    setStartDate(subDays(new Date(), newTimeRange - 1));
  }, [windowWidth]);
  
  if (habits.length === 0) {
    return null;
  }
  
  // Get the habit with the longest streak for the header display
  const sortedHabits = [...habits].sort((a, b) => {
    const streakA = differenceInDays(new Date(), new Date(a.lastReset));
    const streakB = differenceInDays(new Date(), new Date(b.lastReset));
    return streakB - streakA;
  });
  
  const primaryHabit = sortedHabits[0];
  const currentStreak = differenceInDays(new Date(), new Date(primaryHabit.lastReset));
  
  // Generate dates for the timeline based on startDate
  const today = startOfDay(new Date());
  const endDate = addDays(startDate, timeRange - 1);
  const dates = Array.from({ length: timeRange }, (_, i) => {
    return addDays(startDate, i);
  });
  
  // Navigate timeline
  const handlePrevious = () => {
    setStartDate(subDays(startDate, timeRange));
  };
  
  const handleNext = () => {
    const newStartDate = addDays(startDate, timeRange);
    const latestPossibleStart = subDays(today, timeRange - 1);
    
    if (isAfter(newStartDate, latestPossibleStart)) {
      setStartDate(latestPossibleStart);
    } else {
      setStartDate(newStartDate);
    }
  };
  
  // Check if we can go next (if we're not already showing the most recent timeRange days)
  const canGoNext = isBefore(endDate, today);
  
  // Check if there was a reset on a specific date for any habit
  const getResetsOnDate = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const resetsOnDate = habits.filter(habit => 
      habit.resets.some(reset => {
        const resetDate = new Date(reset);
        return resetDate >= dayStart && resetDate <= dayEnd;
      })
    );
    
    return resetsOnDate;
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gridColsStyle }} />
      <Card className="dark:bg-gray-800/90 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2 dark:text-gray-200">
              <Calendar className="h-4 w-4 text-primary dark:text-purple-400" />
              Streak Timeline
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious}
                className="h-7 w-7 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                disabled={!canGoNext}
                className="h-7 w-7 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {format(dates[0], 'MMM d, yyyy')} — {format(dates[dates.length - 1], 'MMM d, yyyy')}
          </div>
          
          {/* Timeline with responsive number of days */}
          <div className="flex justify-between w-full pb-2">
            {dates.map((date, index) => renderDateItem(date, index))}
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{primaryHabit.name}:</span> 
              <span className="font-bold text-green-600 dark:text-green-400 ml-1">{currentStreak} day streak</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
  
  // Helper function to render a date item
  function renderDateItem(date: Date, index: number) {
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const resetsOnDate = getResetsOnDate(date);
    const hasReset = resetsOnDate.length > 0;
    
    return (
      <TooltipProvider key={date.toISOString()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 w-6 text-center">
                {format(date, 'dd')}
              </div>
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isToday 
                    ? 'bg-primary/20 dark:bg-primary/30' 
                    : hasReset 
                      ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50' 
                      : 'bg-green-100 dark:bg-green-900/30'
                }`}
              >
                {hasReset ? (
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                )}
              </div>
              {index === 0 || index === dates.length - 1 || index % 5 === 0 ? (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 w-6 text-center">
                  {format(date, 'MMM')}
                </div>
              ) : (
                <div className="h-3"></div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <div className="text-xs">
              <p className="font-medium">{format(date, 'MMMM d, yyyy')}</p>
              {hasReset ? (
                <div className="mt-1">
                  <p className="text-red-600 dark:text-red-400 font-medium">Reset day for:</p>
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    {resetsOnDate.map(habit => (
                      <li key={habit.id} className="text-gray-600 dark:text-gray-300">• {habit.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-400 mt-1">Streak maintained for all habits</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
} 