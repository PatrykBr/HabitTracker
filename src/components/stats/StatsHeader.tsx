
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, ChevronLeft, Download } from "lucide-react";

interface StatsHeaderProps {
  habits: any[];
  selectedHabitId: string;
  onHabitChange: (value: string) => void;
  onExport: () => void;
  onBack: () => void;
}

export function StatsHeader({ habits, selectedHabitId, onHabitChange, onExport, onBack }: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BarChart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Progress Analysis</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
        <Select value={selectedHabitId} onValueChange={onHabitChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a habit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habits</SelectItem>
            {habits.map(habit => (
              <SelectItem key={habit.id} value={habit.id}>
                {habit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
