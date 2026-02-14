"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: string
  plan: string
  status: string
  start_date: string
  expiry_date: string
}

interface Plan {
  name: string
  price: number | string | null
  currency: string
  features: string[]
}

const PLANS: Record<string, Plan> = {
  free: {
    name: "Free",
    price: 0,
    currency: "USD",
    features: [
      "1 business",
      "Up to 50 products",
      "Basic sales tracking",
      "Business-level PIN security",
      "Basic reports",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 2.99,
    currency: "USD",
    features: [
      "Up to 2 businesses",
      "Up to 100 products",
      "Sales analytics (daily/weekly/monthly)",
      "Business-level PIN security",
      "Expense management",
      "Reports (PDF/CSV)",
      "Email support (24-48h)",
    ],
  },
  "pro-plus": {
    name: "Pro Plus",
    price: 3.99,
    currency: "USD",
    features: [
      "Up to 5 businesses",
      "Unlimited products & inventory",
      "Advanced analytics & forecasting",
      "Staff management (up to 10)",
      "Supplier management",
      "Business-level PIN security",
      "Priority email support (12-24h)",
      "Reports (PDF/Excel/CSV)",
      "Profit analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 7.99,
    currency: "USD",
    features: [
      "Unlimited businesses",
      "Unlimited products, inventory, staff, suppliers",
      "Advanced analytics & real-time forecasting",
      "Real-time dashboard",
      "All reports with custom date ranges",
      "Business-level PIN security",
      "Phone + Priority email support (4-8h)",
      "API access for integrations",
    ],
  },
}

export default function SubscriptionBilling() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

      setSubscription(data)
      setLoading(false)
    }
    fetchSubscription()
  }, [])

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "pro-plus":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "enterprise":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading subscription details...</div>
  }

  const currentPlan = subscription ? PLANS[subscription.plan] : PLANS.free

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details and plan information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              {/* Plan Status */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Plan</p>
                  <Badge className={getPlanColor(subscription.plan)}>
                    {PLANS[subscription.plan]?.name || "Unknown"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Start Date</p>
                  <p className="text-sm font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Renewal Date</p>
                  <p className="text-sm font-medium">{new Date(subscription.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Features Included */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Included Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active subscription found</p>
              <p className="text-xs text-muted-foreground mt-2">You are currently using the Free plan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {subscription?.plan !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>Get access to more features and grow your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {subscription?.plan !== "pro" && (
                <Link href="/billing/checkout?plan=pro&cycle=monthly">
                  <Button className="w-full">Upgrade to Pro ($2.99/mo)</Button>
                </Link>
              )}
              {subscription?.plan !== "pro-plus" && (
                <Link href="/billing/checkout?plan=pro-plus&cycle=monthly">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Upgrade to Pro Plus ($3.99/mo)</Button>
                </Link>
              )}
              <Link href="/pricing">
                <Button className="w-full bg-amber-600 hover:bg-amber-700" variant="default">
                  Contact for Enterprise
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-200">Payment System Active</p>
              <p className="text-green-700 dark:text-green-300 mt-1">
                We use Paystack for secure payment processing. Your subscription can be managed from the checkout page
                with support for monthly, quarterly, and annual billing cycles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Want to see all plans?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Compare features and pricing across all subscription tiers
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                View Pricing <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
