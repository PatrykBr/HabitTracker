
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatTimeSince } from '@/utils/format-time';
import { Clock, RotateCcw, History, Plus, Calendar } from 'lucide-react';
import type { Habit } from '@/hooks/use-habits';

interface HabitCardProps {
  habit: Habit;
  onReset: () => void;
  onDeleteReset: (index: number) => void;
  onAddCustomReset?: (resetTime: Date) => void;
}

export function HabitCard({ habit, onReset, onDeleteReset, onAddCustomReset }: HabitCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReset, setShowAddReset] = useState(false);
  const [customResetTime, setCustomResetTime] = useState('');

  const handleAddCustomReset = () => {
    if (customResetTime && onAddCustomReset) {
      onAddCustomReset(new Date(customResetTime));
      setCustomResetTime('');
      setShowAddReset(false);
    }
  };

  const timeSince = formatTimeSince(habit.lastReset);

  return (
    <>
      <Card className="w-full p-6 backdrop-blur-sm bg-white/90 hover:bg-white/95 transition-all duration-300 animate-fade-in hover:shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-primary">{habit.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Clock className="h-4 w-4" />
                <span>{timeSince}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHistory(true)}
              className="hover:bg-secondary transition-colors"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 hover:scale-[1.02]"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Progress
          </Button>
        </div>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset History</DialogTitle>
            <DialogDescription>View and manage your habit reset history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button
              variant="outline"
              className="w-full hover:bg-secondary/50 transition-colors"
              onClick={() => setShowAddReset(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Reset
            </Button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {habit.resets.map((reset, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(reset).toLocaleString()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteReset(index)}
                    className="hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              )).reverse()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddReset} onOpenChange={setShowAddReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Reset Time</DialogTitle>
            <DialogDescription>Select a specific date and time for this reset</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="datetime-local"
              value={customResetTime}
              onChange={(e) => setCustomResetTime(e.target.value)}
              className="focus:ring-2 focus:ring-primary"
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white"
              onClick={handleAddCustomReset}
              disabled={!customResetTime}
            >
              Add Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
