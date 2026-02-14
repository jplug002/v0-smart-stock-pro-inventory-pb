"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface SubscriptionData {
  name: string
  value: number
  percentage: number
}

export function SubscriptionBreakdown() {
  const [data, setData] = useState<SubscriptionData[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  // Colors for each plan
  const COLORS = {
    free: "#6b7280",
    pro: "#3b82f6",
    pro_plus: "#8b5cf6",
    enterprise: "#f59e0b",
  }

  useEffect(() => {
    const fetchSubscriptionBreakdown = async () => {
      try {
        const { data: subscriptions } = await supabase.from("subscriptions").select("plan, status")

        const planCounts: Record<string, number> = {
          free: 0,
          pro: 0,
          pro_plus: 0,
          enterprise: 0,
        }

        subscriptions?.forEach((sub) => {
          if (sub.status === "active") {
            planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1
          }
        })

        const total = Object.values(planCounts).reduce((a, b) => a + b, 0)

        const chartData: SubscriptionData[] = Object.entries(planCounts)
          .filter(([_, count]) => count > 0)
          .map(([plan, count]) => ({
            name: plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " "),
            value: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }))

        setData(chartData)
      } catch (error) {
        console.error("[v0] Error fetching subscription breakdown:", error)
      }
    }

    fetchSubscriptionBreakdown()
  }, [supabase])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={COLORS[entry.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--card-foreground))" }}
          formatter={(value) => `${value} users`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
