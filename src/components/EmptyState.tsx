import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Lightbulb, ArrowRight, Flame, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  onAddHabit: () => void;
}

export function EmptyState({ onAddHabit }: EmptyStateProps) {
  const habitSuggestions = [
    "Daily meditation",
    "Reading for 20 minutes",
    "Drinking enough water",
    "Exercise or stretching",
    "Journaling",
    "Learning a new skill"
  ];
  
  return (
    <Card className="col-span-full p-8 card-glass dark:bg-gray-800/90 dark:border-gray-700">
      <div className="text-center space-y-6 max-w-lg mx-auto">
        <div className="inline-block p-4 bg-purple-50 dark:bg-gray-700 rounded-full">
          <Plus className="h-10 w-10 text-primary dark:text-purple-400 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200">
            Start Your Unbroken Streak
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your habits, build consistency, and maintain your streak without resets.
          </p>
        </div>
        
        <div className="bg-orange-50 dark:bg-gray-700/50 rounded-lg p-4 text-left border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-start gap-3 mb-3">
            <Flame className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Your Mission: Avoid Resets</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 pl-8">
            The key to success is maintaining your streak without interruption. Every day you complete your habit strengthens your chain of consistency.
          </p>
          
          <div className="flex items-start gap-3 mb-2 pl-8">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Remember:</strong> A reset breaks your streak and you'll start from zero again.
            </p>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-left">
          <div className="flex items-start gap-3 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Habit Suggestions</h3>
          </div>
          
          <ul className="space-y-2 pl-8 text-sm text-gray-600 dark:text-gray-400">
            {habitSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-primary dark:text-purple-400 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={onAddHabit}
            className="bg-gradient-to-r from-primary via-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white shadow-md hover:shadow-lg transition-all duration-300 px-8 py-6"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Start Your Unbroken Streak
          </Button>
        </div>
        
        <p className="text-sm text-purple-400 dark:text-purple-300">
          Start with just one habit for the best results! ✨
        </p>
      </div>
    </Card>
  );
} 