
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimeDistributionProps {
  times: { time: string; count: number }[];
}

export function TimeDistribution({ times }: TimeDistributionProps) {
  if (!times.length) return null;

  const maxCount = Math.max(...times.map(t => t.count));

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-sky-900">
          <Clock className="h-5 w-5 text-sky-600" />
          Common Reset Times
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {times.map(({ time, count }, index) => (
            <div key={time} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-700 font-medium">{time}</span>
                <span className="text-sky-600">{count} resets</span>
              </div>
              <div className="h-2 w-full bg-sky-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-sky-500 to-cyan-500"
                  style={{ 
                    width: `${(count / maxCount) * 100}%`,
                    opacity: 1 - (index * 0.15) // Fade out less frequent times
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-sky-600 mt-4">
          💡 Understanding when resets commonly occur can help you prepare and strengthen your resolve during these times.
        </p>
      </CardContent>
    </Card>
  );
}
