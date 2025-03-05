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
        <BarChart className="h-6 w-6 text-primary dark:text-purple-400" />
        <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Progress Analysis</h1>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/80 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border-purple-100 dark:border-gray-700 dark:text-gray-300"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Data</span>
        </Button>
        <Select value={selectedHabitId} onValueChange={onHabitChange}>
          <SelectTrigger className="w-[140px] sm:w-[200px] bg-white/80 dark:bg-gray-800 border-purple-100 dark:border-gray-700 dark:text-gray-300">
            <SelectValue placeholder="Select a habit" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700">
            <SelectItem value="all" className="dark:text-gray-300">All Habits</SelectItem>
            {habits.map(habit => (
              <SelectItem key={habit.id} value={habit.id} className="dark:text-gray-300">
                {habit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-purple-50 dark:hover:bg-gray-700 dark:text-gray-300"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>
    </div>
  );
}
