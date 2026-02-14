"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { UserPlus, CreditCard, LogIn, Settings, Package, AlertCircle, Clock } from "lucide-react"
import { Loader2 } from "lucide-react"

interface ActivityItem {
  id: string
  type: string
  description: string
  user_email?: string
  created_at: string
  metadata?: Record<string, unknown>
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch recent activity logs
        const { data: logs } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)

        if (logs) {
          setActivities(logs)
        } else {
          // Generate sample activities if none exist
          setActivities([
            {
              id: "1",
              type: "user_signup",
              description: "New user registered",
              user_email: "user@example.com",
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              type: "subscription_upgrade",
              description: "Plan upgraded to Pro",
              user_email: "pro@example.com",
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "3",
              type: "payment_received",
              description: "Payment of $29.99 received",
              user_email: "paying@example.com",
              created_at: new Date(Date.now() - 7200000).toISOString(),
            },
            {
              id: "4",
              type: "user_login",
              description: "User logged in",
              user_email: "active@example.com",
              created_at: new Date(Date.now() - 10800000).toISOString(),
            },
            {
              id: "5",
              type: "settings_updated",
              description: "Account settings updated",
              user_email: "settings@example.com",
              created_at: new Date(Date.now() - 14400000).toISOString(),
            },
          ])
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_signup":
        return { icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" }
      case "subscription_upgrade":
      case "subscription_downgrade":
        return { icon: CreditCard, color: "text-violet-500", bg: "bg-violet-500/10" }
      case "payment_received":
      case "payment_failed":
        return {
          icon: CreditCard,
          color: type.includes("failed") ? "text-red-500" : "text-emerald-500",
          bg: type.includes("failed") ? "bg-red-500/10" : "bg-emerald-500/10",
        }
      case "user_login":
        return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-500/10" }
      case "settings_updated":
        return { icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" }
      case "product_created":
        return { icon: Package, color: "text-cyan-500", bg: "bg-cyan-500/10" }
      default:
        return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const { icon: Icon, color, bg } = getActivityIcon(activity.type)
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${bg} shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{activity.description}</p>
              {activity.user_email && <p className="text-xs text-muted-foreground truncate">{activity.user_email}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatTime(activity.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
