import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  invertTrend?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
  invertTrend = false,
}: MetricCardProps) {
  // Determine if the change is positive based on invertTrend flag
  const isPositive = invertTrend ? change < 0 : change > 0
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 lg:p-6">
        {/* Icon and trend indicator */}
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isPositive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            <TrendIcon className="w-3 h-3" />
            {Math.abs(change)}%
          </div>
        </div>

        {/* Metric value and title */}
        <div className="mt-4">
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}
