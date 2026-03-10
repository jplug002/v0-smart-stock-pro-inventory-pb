"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, CreditCard, TrendingUp, UserCheck, RefreshCw } from "lucide-react"

interface Stats {
  totalUsers: number
  premiumUsers: number
  proUsers: number
  proPlusUsers: number
  enterpriseUsers: number
  mrr: number
  newUsersThisMonth: number
  newPremiumSubscriptionsThisMonth: number
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Memoized fetch function so we can call it from real-time updates
  const fetchStats = useCallback(async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true })

      // Fetch subscription breakdown
      const { data: subscriptions } = await supabase.from("subscriptions").select("plan, status")

      let premiumUsers = 0
      let proUsers = 0
      let proPlusUsers = 0
      let enterpriseUsers = 0

      subscriptions?.forEach((sub) => {
        if (sub.status === "active") {
          if (sub.plan === "pro") proUsers++
          else if (sub.plan === "pro_plus") proPlusUsers++
          else if (sub.plan === "enterprise") enterpriseUsers++
          if (sub.plan !== "free") premiumUsers++
        }
      })

      // Fetch Paystack transactions for MRR (using paystack_transactions table)
      const { data: transactions } = await supabase
        .from("paystack_transactions")
        .select("amount")
        .eq("status", "success")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      // Paystack amounts are in kobo (NGN) - convert to display value
      const mrr = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      // Fetch new users this month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count: newUsersThisMonth } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart)

      // Fetch new premium subscriptions
      const { count: newPremiumSubscriptionsThisMonth } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart)
        .neq("plan", "free")

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers,
        proUsers,
        proPlusUsers,
        enterpriseUsers,
        mrr: Math.floor(mrr / 100), // Convert from kobo to Naira
        newUsersThisMonth: newUsersThisMonth || 0,
        newPremiumSubscriptionsThisMonth: newPremiumSubscriptionsThisMonth || 0,
      })
    } catch (error) {
      console.error("[v0] Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()

    // Set up real-time subscription for subscriptions and transactions
    const subscriptionsChannel = supabase
      .channel("stats_subscriptions_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => {
          // Refetch stats when subscriptions change
          fetchStats()
        }
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel("stats_transactions_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "paystack_transactions" },
        () => {
          // Refetch stats when transactions change
          fetchStats()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(subscriptionsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [fetchStats, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) return null

  // Format currency for Nigerian Naira
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Premium Users", value: stats.premiumUsers, icon: UserCheck, color: "text-green-500" },
    { label: "Monthly Revenue", value: formatNaira(stats.mrr), icon: CreditCard, color: "text-green-600" },
    { label: "Pro Subscriptions", value: stats.proUsers, icon: TrendingUp, color: "text-purple-500" },
    { label: "Pro Plus Subscriptions", value: stats.proPlusUsers, icon: TrendingUp, color: "text-indigo-500" },
    { label: "Enterprise Subscriptions", value: stats.enterpriseUsers, icon: TrendingUp, color: "text-orange-500" },
    { label: "New Users (Month)", value: stats.newUsersThisMonth, icon: Users, color: "text-cyan-500" },
    {
      label: "New Premium (Month)",
      value: stats.newPremiumSubscriptionsThisMonth,
      icon: CreditCard,
      color: "text-pink-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
