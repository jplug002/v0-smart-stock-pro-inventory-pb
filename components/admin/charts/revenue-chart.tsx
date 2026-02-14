"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, created_at, status")
          .eq("status", "completed")

        const monthlyRevenue: Record<string, { revenue: number; subscriptions: number }> = {}

        payments?.forEach((payment) => {
          const date = new Date(payment.created_at)
          const month = date.toLocaleString("default", { month: "short", year: "2-digit" })

          if (!monthlyRevenue[month]) {
            monthlyRevenue[month] = { revenue: 0, subscriptions: 0 }
          }

          monthlyRevenue[month].revenue += payment.amount || 0
          monthlyRevenue[month].subscriptions += 1
        })

        const chartData: RevenueData[] = Object.entries(monthlyRevenue)
          .slice(-12) // Last 12 months
          .map(([month, data]) => ({
            month,
            revenue: Math.round(data.revenue / 100), // Convert cents to dollars
            subscriptions: data.subscriptions,
          }))

        setData(chartData)
      } catch (error) {
        console.error("[v0] Error fetching revenue data:", error)
      }
    }

    fetchRevenueData()
  }, [supabase])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" className="text-muted-foreground" />
        <YAxis className="text-muted-foreground" yAxisId="left" />
        <YAxis className="text-muted-foreground" yAxisId="right" orientation="right" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--card-foreground))" }}
          formatter={(value) => {
            if (typeof value === "number" && value > 100) {
              return `$${value}`
            }
            return value
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue ($)" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="subscriptions" fill="#3b82f6" name="Subscriptions (#)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
