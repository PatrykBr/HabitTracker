import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimeDistributionProps {
  times: { time: string; count: number }[];
  title?: string;
  description?: string;
}

export function TimeDistribution({ times, title = "Common Reset Times", description }: TimeDistributionProps) {
  if (!times.length) return null;

  const maxCount = Math.max(...times.map(t => t.count));

  return (
    <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-sky-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-sky-900 dark:text-sky-400">
          <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {times.map(({ time, count }, index) => (
            <div key={time} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-700 dark:text-sky-300 font-medium">{time}</span>
                <span className="text-sky-600 dark:text-sky-400">{count} resets</span>
              </div>
              <div className="h-2 w-full bg-sky-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-red-500 to-amber-500"
                  style={{ 
                    width: `${(count / maxCount) * 100}%`,
                    opacity: 1 - (index * 0.15) // Fade out less frequent times
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-sky-600 dark:text-sky-400 mt-4">
          💡 Understanding when resets commonly occur can help you prepare and strengthen your resolve during these times.
        </p>
      </CardContent>
    </Card>
  );
}
