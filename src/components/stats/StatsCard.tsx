import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, TrendingDown, AlertTriangle, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: string;
  trend?: any;
  className?: string;
  emoji?: string;
  progressPercentage?: number;
  tooltipContent?: string;
  invertProgress?: boolean;
}

export function StatsCard({ 
  title, 
  icon, 
  value, 
  description, 
  trend, 
  className,
  emoji,
  progressPercentage,
  tooltipContent,
  invertProgress = false
}: StatsCardProps) {
  const getTrendIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-down':
        return <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'arrow-down':
        return <ArrowDown className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case 'alert-triangle':
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return null;
    }
  };

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden",
      "transition-all duration-300",
      "dark:border-gray-700 dark:bg-gray-800",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium dark:text-gray-200">
          {icon}
          {title}
          {emoji && <span className="text-base">{emoji}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-sky-700 via-sky-800 to-sky-900 dark:from-sky-400 dark:via-sky-300 dark:to-sky-200 bg-clip-text text-transparent">
            {value}
          </p>
          <p className="text-sm text-sky-700 dark:text-sky-300">
            {description}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(trend.icon)}
              <p className={`text-xs ${trend.color} ${trend.color.includes('text-red') ? 'dark:text-red-400' : trend.color.includes('text-amber') ? 'dark:text-amber-400' : trend.color.includes('text-green') ? 'dark:text-green-400' : 'dark:text-sky-400'}`}>
                {trend.text} {trend.emoji}
              </p>
            </div>
          )}
          {typeof progressPercentage === 'number' && (
            <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  invertProgress 
                    ? 'bg-gradient-to-r from-red-500 to-amber-500' 
                    : 'bg-gradient-to-r from-sky-500 to-cyan-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}
