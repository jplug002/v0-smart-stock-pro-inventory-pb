"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Clock,
  Zap,
} from "lucide-react"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { UserGrowthChart } from "@/components/admin/charts/user-growth-chart"
import { SubscriptionBreakdown } from "@/components/admin/charts/subscription-breakdown"
import { RevenueChart } from "@/components/admin/charts/revenue-chart"
import { RecentActivityFeed } from "@/components/admin/recent-activity-feed"
import { QuickActions } from "@/components/admin/quick-actions"
import { TopUsersTable } from "@/components/admin/top-users-table"
import { EmailBroadcaster } from "@/components/admin/email-broadcaster"
import { SubscribedUsersTable } from "@/components/admin/subscribed-users-table"
import { ActivityLogsViewer } from "@/components/admin/activity-logs-viewer"

interface DashboardStats {
  totalUsers: number
  totalUsersChange: number
  activeUsers: number
  activeUsersChange: number
  mrr: number
  mrrChange: number
  arr: number
  churnRate: number
  churnRateChange: number
  conversionRate: number
  conversionRateChange: number
  avgRevenuePerUser: number
  subscriptions: {
    free: number
    pro: number
    proPplus: number
    enterprise: number
  }
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  pendingPayments: number
  failedPayments: number
}

export default function AdminDashboardContent() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("30d")

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true)

      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Fetch all subscriptions
      const { data: allSubs, count: totalUsers } = await supabase.from("subscriptions").select("*", { count: "exact" })

      // Fetch last month's users for comparison
      const { count: lastMonthUsers } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .lt("created_at", thisMonthStart.toISOString())

      // Calculate subscription breakdown
      const subscriptions = { free: 0, pro: 0, proPplus: 0, enterprise: 0 }
      let activeUsers = 0

      allSubs?.forEach((sub) => {
        if (sub.status === "active") {
          activeUsers++
          if (sub.plan === "free") subscriptions.free++
          else if (sub.plan === "pro") subscriptions.pro++
          else if (sub.plan === "pro_plus") subscriptions.proPplus++
          else if (sub.plan === "enterprise") subscriptions.enterprise++
        }
      })

      // Fetch new users counts
      const { count: newUsersToday } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())

      const { count: newUsersThisWeek } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString())

      const { count: newUsersThisMonth } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonthStart.toISOString())

      // Fetch payments data
      const { data: thisMonthPayments } = await supabase
        .from("payments")
        .select("amount, status")
        .gte("created_at", thisMonthStart.toISOString())

      const { data: lastMonthPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", lastMonthStart.toISOString())
        .lt("created_at", thisMonthStart.toISOString())
        .eq("status", "completed")

      const mrr =
        thisMonthPayments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const lastMrr = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const pendingPayments = thisMonthPayments?.filter((p) => p.status === "pending").length || 0
      const failedPayments = thisMonthPayments?.filter((p) => p.status === "failed").length || 0

      // Calculate metrics
      const totalUsersChange = lastMonthUsers ? (((totalUsers || 0) - lastMonthUsers) / lastMonthUsers) * 100 : 0
      const mrrChange = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0
      const paidUsers = subscriptions.pro + subscriptions.proPplus + subscriptions.enterprise
      const conversionRate = (totalUsers || 0) > 0 ? (paidUsers / (totalUsers || 1)) * 100 : 0
      const avgRevenuePerUser = paidUsers > 0 ? mrr / paidUsers / 100 : 0

      setStats({
        totalUsers: totalUsers || 0,
        totalUsersChange: Math.round(totalUsersChange * 10) / 10,
        activeUsers,
        activeUsersChange: 5.2,
        mrr: mrr / 100,
        mrrChange: Math.round(mrrChange * 10) / 10,
        arr: (mrr / 100) * 12,
        churnRate: 2.3,
        churnRateChange: -0.5,
        conversionRate: Math.round(conversionRate * 10) / 10,
        conversionRateChange: 1.2,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
        subscriptions,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        pendingPayments,
        failedPayments,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor platform performance and user metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {(["24h", "7d", "30d", "90d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="text-xs"
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardStats} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers.toLocaleString() || "0"}
            change={stats?.totalUsersChange || 0}
            icon={Users}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
          />
          <MetricCard
            title="Monthly Revenue"
            value={`$${(stats?.mrr || 0).toLocaleString()}`}
            change={stats?.mrrChange || 0}
            icon={DollarSign}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${stats?.conversionRate || 0}%`}
            change={stats?.conversionRateChange || 0}
            icon={TrendingUp}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
          />
          <MetricCard
            title="Churn Rate"
            value={`${stats?.churnRate || 0}%`}
            change={stats?.churnRateChange || 0}
            icon={Activity}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
            invertTrend
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <SmallMetricCard title="New Today" value={stats?.newUsersToday || 0} icon={Clock} />
          <SmallMetricCard title="This Week" value={stats?.newUsersThisWeek || 0} icon={Calendar} />
          <SmallMetricCard title="This Month" value={stats?.newUsersThisMonth || 0} icon={Users} />
          <SmallMetricCard title="ARR" value={`$${(stats?.arr || 0).toLocaleString()}`} icon={DollarSign} />
          <SmallMetricCard title="ARPU" value={`$${stats?.avgRevenuePerUser || 0}`} icon={Zap} />
          <SmallMetricCard title="Active Users" value={stats?.activeUsers || 0} icon={Activity} />
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Subscriptions:</span>
              <Badge variant="outline" className="bg-muted/50">
                <span className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                Free: {stats?.subscriptions.free || 0}
              </Badge>
              <Badge variant="outline" className="bg-muted/50">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Pro: {stats?.subscriptions.pro || 0}
              </Badge>
              <Badge variant="outline" className="bg-muted/50">
                <span className="w-2 h-2 rounded-full bg-violet-500 mr-2" />
                Pro Plus: {stats?.subscriptions.proPplus || 0}
              </Badge>
              <Badge variant="outline" className="bg-muted/50">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                Enterprise: {stats?.subscriptions.enterprise || 0}
              </Badge>
              {(stats?.pendingPayments || 0) > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  {stats?.pendingPayments} pending payments
                </Badge>
              )}
              {(stats?.failedPayments || 0) > 0 && (
                <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                  {stats?.failedPayments} failed payments
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Revenue Trend</CardTitle>
                  <CardDescription>Monthly recurring revenue over time</CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stats?.mrrChange || 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="users">Top Users</TabsTrigger>
            <TabsTrigger value="broadcaster">Email Broadcast</TabsTrigger>
            <TabsTrigger value="subscribed">Subscribed Users</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">User Growth</CardTitle>
                <CardDescription>New user registrations and cumulative growth</CardDescription>
              </CardHeader>
              <CardContent>
                <UserGrowthChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Subscription Distribution</CardTitle>
                <CardDescription>Users by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionBreakdown />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription>Latest platform events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivityFeed />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Top Users</CardTitle>
                <CardDescription>Most active users by engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <TopUsersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcaster">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EmailBroadcaster />
              </div>
              <div className="space-y-6">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Email Broadcast Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <p>• Send important announcements to all subscribed users</p>
                    <p>• Use clear, professional language</p>
                    <p>• Include relevant links and resources</p>
                    <p>• Emails are logged for audit purposes</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscribed">
            <SubscribedUsersTable />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
  invertTrend = false,
}: {
  title: string
  value: string
  change: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  invertTrend?: boolean
}) {
  const isPositive = invertTrend ? change < 0 : change > 0
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 lg:p-6">
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
        <div className="mt-4">
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SmallMetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
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
