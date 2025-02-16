
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrendIndicator } from "@/utils/statistics";
import { ArrowDown, ArrowUp, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: string;
  trend?: any;
  className?: string;
}

export function StatsCard({ title, icon, value, description, trend, className }: StatsCardProps) {
  const getTrendIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'arrow-up':
        return <ArrowUp className="h-4 w-4 text-emerald-600" />;
      case 'arrow-down':
        return <ArrowDown className="h-4 w-4 text-amber-600" />;
      case 'alert-triangle':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-blue-600">
            {value}
          </p>
          <p className="text-sm text-gray-600">
            {description}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon(trend.icon)}
              <p className={`text-xs ${trend.color}`}>
                {trend.text}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
