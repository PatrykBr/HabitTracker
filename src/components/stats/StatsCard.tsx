
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, TrendingDown, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: string;
  trend?: any;
  className?: string;
  emoji?: string;
  progressPercentage?: number;
}

export function StatsCard({ 
  title, 
  icon, 
  value, 
  description, 
  trend, 
  className,
  emoji,
  progressPercentage 
}: StatsCardProps) {
  const getTrendIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-down':
        return <TrendingDown className="h-4 w-4 text-emerald-600" />;
      case 'arrow-down':
        return <ArrowDown className="h-4 w-4 text-teal-600" />;
      case 'alert-triangle':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {icon}
          {title}
          {emoji && <span className="text-base">{emoji}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-sky-700 via-sky-800 to-sky-900 bg-clip-text text-transparent">
            {value}
          </p>
          <p className="text-sm text-sky-700">
            {description}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(trend.icon)}
              <p className={`text-xs ${trend.color}`}>
                {trend.text} {trend.emoji}
              </p>
            </div>
          )}
          {typeof progressPercentage === 'number' && (
            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-sky-500 to-cyan-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
