import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTimeSince } from '@/utils/formatting/format-time';
import { Clock, RotateCcw, History, Plus, Edit, Trash2, Award, MoreHorizontal, Flame } from 'lucide-react';
import { Habit } from '@/types/habits/habit.types';
import { differenceInDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HabitHistory } from './HabitHistory';
import { HabitResetForm } from './HabitResetForm';
import { HabitEditForm } from './HabitEditForm';
import { HabitDeleteConfirm } from './HabitDeleteConfirm';
import { HabitResetConfirm } from './HabitResetConfirm';

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
  
  // Calculate streak and determine visual styling
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
                {currentStreakDays > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Don't break the chain!
                  </span>
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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
            <Clock className={`h-4 w-4 ${streakTextColors[streakLevel]}`} />
            <span>{formatTimeSince(habit.lastReset)}</span>
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
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{formatTimeSince(habit.lastReset)}</span>
              </div>
              
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
      {showHistory && (
        <HabitHistory 
          habit={habit}
          onClose={() => setShowHistory(false)}
          onDeleteReset={onDeleteReset}
          onAddCustomReset={onAddCustomReset}
        />
      )}

      {/* Add Custom Reset Dialog */}
      {showAddReset && (
        <HabitResetForm
          onClose={() => setShowAddReset(false)}
          onAddCustomReset={onAddCustomReset}
        />
      )}

      {/* Edit Habit Dialog */}
      {showEditHabit && (
        <HabitEditForm
          habit={habit}
          onClose={() => setShowEditHabit(false)}
          onEditHabit={onEditHabit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <HabitDeleteConfirm
          habit={habit}
          onClose={() => setShowDeleteConfirm(false)}
          onDeleteHabit={onDeleteHabit}
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <HabitResetConfirm
          onClose={() => setShowResetConfirm(false)}
          onConfirm={onReset}
        />
      )}
    </>
  );
} 