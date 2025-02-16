
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
            Reset Progress
          </Button>
        </div>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset History</DialogTitle>
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
        </DialogContent>
      </Dialog>

      <Dialog open={showAddReset} onOpenChange={setShowAddReset}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Reset Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="datetime-local"
              value={customResetTime}
              onChange={(e) => setCustomResetTime(e.target.value)}
            />
            <Button
              className="w-full"
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
