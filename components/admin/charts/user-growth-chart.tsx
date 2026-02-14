"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface UserGrowthData {
  month: string
  newUsers: number
  totalUsers: number
}

export function UserGrowthChart() {
  const [data, setData] = useState<UserGrowthData[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  useEffect(() => {
    const fetchUserGrowth = async () => {
      try {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("created_at")
          .order("created_at", { ascending: true })

        const monthlyData: Record<string, number> = {}
        subscriptions?.forEach((sub) => {
          const date = new Date(sub.created_at)
          const month = date.toLocaleString("default", { month: "short", year: "2-digit" })
          monthlyData[month] = (monthlyData[month] || 0) + 1
        })

        let cumulativeTotal = 0
        const chartData: UserGrowthData[] = Object.entries(monthlyData)
          .slice(-12) // Last 12 months
          .map(([month, count]) => {
            cumulativeTotal += count
            return {
              month,
              newUsers: count,
              totalUsers: cumulativeTotal,
            }
          })

        setData(chartData)
      } catch (error) {
        console.error("[v0] Error fetching user growth:", error)
      }
    }

    fetchUserGrowth()
  }, [supabase])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" className="text-muted-foreground" />
        <YAxis className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--card-foreground))" }}
        />
        <Legend />
        <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" name="New Users" strokeWidth={2} />
        <Line type="monotone" dataKey="totalUsers" stroke="#10b981" name="Total Users" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
