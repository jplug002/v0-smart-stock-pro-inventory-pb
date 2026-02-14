"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, DollarSign, RefreshCw, Download } from "lucide-react"
import { SubscriptionBreakdown } from "@/components/admin/charts/subscription-breakdown"

interface Subscription {
  id: string
  user_id: string
  plan: string
  status: string
  created_at: string
  updated_at: string
  billing_cycle?: string
  start_date?: string
  expiry_date?: string
  is_trial?: boolean
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchSubscriptions()
  }, [planFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false })

      if (planFilter !== "all") {
        query = query.eq("plan", planFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: subscriptions.length,
    free: subscriptions.filter((s) => s.plan === "free").length,
    pro: subscriptions.filter((s) => s.plan === "pro").length,
    proPlus: subscriptions.filter((s) => s.plan === "pro_plus").length,
    enterprise: subscriptions.filter((s) => s.plan === "enterprise").length,
    active: subscriptions.filter((s) => s.status === "active").length,
    // MRR in USD with new pricing
    mrr: subscriptions.reduce((sum, s) => {
      if (s.status !== "active") return sum
      if (s.plan === "pro") return sum + 2.99
      if (s.plan === "pro_plus") return sum + 3.99
      if (s.plan === "enterprise") return sum + 7.99
      return sum
    }, 0),
    // MRR in GHS
    mrrGHS: subscriptions.reduce((sum, s) => {
      if (s.status !== "active") return sum
      if (s.plan === "pro") return sum + 29
      if (s.plan === "pro_plus") return sum + 44
      if (s.plan === "enterprise") return sum + 89
      return sum
    }, 0),
  }

  const getPlanBadge = (plan: string) => {
    const badges: Record<string, { className: string; label: string }> = {
      enterprise: { className: "bg-amber-500/10 text-amber-600", label: "Enterprise" },
      pro_plus: { className: "bg-violet-500/10 text-violet-600", label: "Pro Plus" },
      pro: { className: "bg-blue-500/10 text-blue-600", label: "Pro" },
      free: { className: "bg-muted text-muted-foreground", label: "Free" },
    }
    const badge = badges[plan] || badges.free
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground mt-1">Manage subscription plans and billing</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSubscriptions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards - Updated with new pricing */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MRR (USD)</p>
                  <p className="text-2xl font-bold text-foreground">${stats.mrr.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MRR (GHS)</p>
                  <p className="text-2xl font-bold text-foreground">₵{stats.mrrGHS.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Free</p>
                  <p className="text-2xl font-bold text-foreground">{stats.free}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pro</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pro}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pro Plus</p>
                  <p className="text-2xl font-bold text-foreground">{stats.proPlus}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Enterprise</p>
                  <p className="text-2xl font-bold text-foreground">{stats.enterprise}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="list">All Subscriptions</TabsTrigger>
            <TabsTrigger value="plans">Plan Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                  <CardDescription>Users by subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionBreakdown />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Plan Pricing (Updated)</CardTitle>
                  <CardDescription>Current pricing structure with Paystack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Free", priceUSD: "$0", priceGHS: "₵0", features: "1 business, 50 products" },
                    { name: "Pro", priceUSD: "$2.99/mo", priceGHS: "₵29/mo", features: "2 businesses, 100 products" },
                    {
                      name: "Pro Plus",
                      priceUSD: "$3.99/mo",
                      priceGHS: "₵44/mo",
                      features: "5 businesses, unlimited products, staff",
                    },
                    {
                      name: "Enterprise",
                      priceUSD: "$7.99/mo",
                      priceGHS: "₵89/mo",
                      features: "Unlimited, API access, phone support",
                    },
                  ].map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.features}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{plan.priceUSD}</p>
                        <p className="text-xs text-muted-foreground">{plan.priceGHS}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list">
            {/* Filters */}
            <Card className="bg-card border-border mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-background">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="pro_plus">Pro Plus</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">User ID</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Plan</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Billing</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Status</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Trial</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Started</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 text-sm text-foreground font-mono">
                              {sub.user_id?.substring(0, 16)}...
                            </td>
                            <td className="py-3 px-4">{getPlanBadge(sub.plan)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                              {sub.billing_cycle || "monthly"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  sub.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-red-500/10 text-red-600"
                                }
                              >
                                {sub.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {sub.is_trial ? (
                                <Badge className="bg-purple-500/10 text-purple-600">Trial</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {sub.start_date ? formatDate(sub.start_date) : formatDate(sub.created_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {sub.expiry_date ? formatDate(sub.expiry_date) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Plan Configuration</CardTitle>
                <CardDescription>Configure plan limits and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Plan</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Price (USD)</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Price (GHS)</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Businesses</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Products</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Staff</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Suppliers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { plan: "Free", usd: 0, ghs: 0, businesses: 1, products: 50, staff: 0, suppliers: 0 },
                        { plan: "Pro", usd: 2.99, ghs: 29, businesses: 2, products: 100, staff: 0, suppliers: 0 },
                        {
                          plan: "Pro Plus",
                          usd: 3.99,
                          ghs: 44,
                          businesses: 5,
                          products: "∞",
                          staff: 10,
                          suppliers: "∞",
                        },
                        {
                          plan: "Enterprise",
                          usd: 7.99,
                          ghs: 89,
                          businesses: "∞",
                          products: "∞",
                          staff: "∞",
                          suppliers: "∞",
                        },
                      ].map((row) => (
                        <tr key={row.plan} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium text-foreground">{row.plan}</td>
                          <td className="py-3 px-4 text-foreground">${row.usd}/mo</td>
                          <td className="py-3 px-4 text-foreground">₵{row.ghs}/mo</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.businesses}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.products}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.staff}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.suppliers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
