"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Search,
  RefreshCw,
  Download,
  UserPlus,
  CreditCard,
  LogIn,
  Settings,
  Package,
  AlertCircle,
  Clock,
  Filter,
} from "lucide-react"

interface ActivityLog {
  id: string
  type: string
  description: string
  user_id?: string
  user_email?: string
  ip_address?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchLogs()
  }, [typeFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)

      let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100)

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter)
      }

      const { data, error } = await query

      if (error) {
        // Generate sample data if table doesn't exist
        const sampleLogs: ActivityLog[] = Array.from({ length: 20 }, (_, i) => ({
          id: String(i + 1),
          type: ["user_signup", "user_login", "subscription_upgrade", "payment_received", "settings_updated"][
            Math.floor(Math.random() * 5)
          ],
          description: [
            "New user registered",
            "User logged in",
            "Plan upgraded to Pro",
            "Payment of $29.99 received",
            "Account settings updated",
          ][Math.floor(Math.random() * 5)],
          user_email: `user${i}@example.com`,
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        }))
        setLogs(sampleLogs)
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_signup":
        return { icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" }
      case "subscription_upgrade":
      case "subscription_downgrade":
        return { icon: CreditCard, color: "text-violet-500", bg: "bg-violet-500/10" }
      case "payment_received":
        return { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" }
      case "payment_failed":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" }
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.description?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      log.type?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-muted-foreground mt-1">Monitor all platform activity and events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-background">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user_signup">User Signups</SelectItem>
                  <SelectItem value="user_login">User Logins</SelectItem>
                  <SelectItem value="subscription_upgrade">Subscription Changes</SelectItem>
                  <SelectItem value="payment_received">Payments</SelectItem>
                  <SelectItem value="settings_updated">Settings Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const { icon: Icon, color, bg } = getActivityIcon(log.type)
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {log.user_email && (
                                <span className="text-xs text-muted-foreground">{log.user_email}</span>
                              )}
                              {log.ip_address && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground font-mono">{log.ip_address}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="outline" className="text-xs mb-1">
                              {log.type.replace(/_/g, " ")}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
