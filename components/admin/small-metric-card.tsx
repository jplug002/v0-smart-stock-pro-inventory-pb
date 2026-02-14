import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface SmallMetricCardProps {
  title: string
  value: string | number
  icon: React.ElementType
}

export function SmallMetricCard({ title, value, icon: Icon }: SmallMetricCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        {/* Icon and metric display */}
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
