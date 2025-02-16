
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatTimeSince } from '@/utils/format-time';
import { Clock, RotateCcw, History, Plus } from 'lucide-react';
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

  return (
    <>
      <Card className="w-full p-6 bg-white/70 hover:bg-white/80 backdrop-blur-sm transition-all duration-300 rounded-xl shadow-sm hover:shadow-md border-0 ring-1 ring-black/5">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-primary">{habit.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatTimeSince(habit.lastReset)}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHistory(true)}
              className="hover:bg-black/5 transition-colors"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 hover:-translate-y-0.5"
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
            <DialogTitle className="text-xl font-semibold">Reset History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Button
              variant="outline"
              className="w-full hover:bg-secondary/50"
              onClick={() => setShowAddReset(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Reset
            </Button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {habit.resets.map((reset, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <span>{new Date(reset).toLocaleString()}</span>
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
            <DialogTitle className="text-xl font-semibold">Add Custom Reset Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              type="datetime-local"
              value={customResetTime}
              onChange={(e) => setCustomResetTime(e.target.value)}
              className="border-2 focus-visible:ring-primary"
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
