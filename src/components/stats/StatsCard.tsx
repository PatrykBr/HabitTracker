
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrendIndicator } from "@/utils/statistics";
import { ArrowDown, TrendingDown, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: string;
  trend?: any;
  className?: string;
  emoji?: string;
}

export function StatsCard({ title, icon, value, description, trend, className, emoji }: StatsCardProps) {
  const getTrendIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-down':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'arrow-down':
        return <ArrowDown className="h-4 w-4 text-emerald-600" />;
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
      "bg-white/50 backdrop-blur-sm border border-gray-100", 
      "transition-all duration-200",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-600">
          {icon}
          {title}
          {emoji && <span className="text-base">{emoji}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {value}
          </p>
          <p className="text-sm text-gray-500">
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
        </div>
      </CardContent>
    </Card>
  );
}
