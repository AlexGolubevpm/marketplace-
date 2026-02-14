import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: "green" | "yellow" | "red" | "default";
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, trend, trendLabel, color = "default", icon }: KpiCardProps) {
  const colorClasses = {
    green: "border-l-4 border-l-green-500",
    yellow: "border-l-4 border-l-yellow-500",
    red: "border-l-4 border-l-red-500",
    default: "",
  };

  return (
    <Card className={cn(colorClasses[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-3xl font-bold">{value}</p>
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              ) : (
                <Minus className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        {trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
