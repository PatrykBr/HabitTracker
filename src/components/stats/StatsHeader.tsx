
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
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <BarChart className="h-6 w-6" />
        <h1 className="text-xl sm:text-2xl font-bold">Progress Analysis</h1>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Data</span>
        </Button>
        <Select value={selectedHabitId} onValueChange={onHabitChange}>
          <SelectTrigger className="w-[140px] sm:w-[200px]">
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
          size="sm"
          className="gap-2"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>
    </div>
  );
}
