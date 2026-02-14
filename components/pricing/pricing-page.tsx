"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap, Gift, Building2, Shield, Users, Package, Phone, Mail, ArrowLeft } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

// Define pricing plans with USD pricing (converted from GHS at 1 USD = 12 GHS)
interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string
  // Prices in USD
  prices: {
    monthly: number
    quarterly: number
    annual: number
  }
  // Prices in GHS (for Paystack)
  pricesGHS: {
    monthly: number
    quarterly: number
    annual: number
  }
  features: { text: string; included: boolean }[]
  limits: {
    businesses: string
    products: string
    staff: string
    suppliers: string
  }
  isFeatured: boolean
  cta: string
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    slug: "free",
    description: "Get started with basic inventory management",
    prices: { monthly: 0, quarterly: 0, annual: 0 },
    pricesGHS: { monthly: 0, quarterly: 0, annual: 0 },
    features: [
      { text: "Basic sales tracking", included: true },
      { text: "Basic expense management", included: true },
      { text: "Business-level PIN security", included: true },
      { text: "Basic reports (PDF only)", included: true },
      { text: "Email support (best effort)", included: true },
      { text: "Analytics dashboard", included: false },
      { text: "Staff management", included: false },
      { text: "Supplier integration", included: false },
      { text: "Forecasting", included: false },
    ],
    limits: {
      businesses: "1 business",
      products: "50 products",
      staff: "No staff",
      suppliers: "No suppliers",
    },
    isFeatured: false,
    cta: "Current Plan",
  },
  {
    id: "pro",
    name: "Pro",
    slug: "pro",
    description: "For growing small businesses",
    prices: { monthly: 2.99, quarterly: 8.07, annual: 28.7 },
    pricesGHS: { monthly: 29, quarterly: 78, annual: 278 },
    features: [
      { text: "Daily/Weekly/Monthly analytics", included: true },
      { text: "Expense categorization", included: true },
      { text: "Business-level PIN security", included: true },
      { text: "Reports (PDF/CSV export)", included: true },
      { text: "Email support (24-48h)", included: true },
      { text: "Staff management", included: false },
      { text: "Supplier integration", included: false },
      { text: "Forecasting", included: false },
    ],
    limits: {
      businesses: "2 businesses",
      products: "100 products",
      staff: "No staff",
      suppliers: "No suppliers",
    },
    isFeatured: false,
    cta: "Upgrade to Pro",
  },
  {
    id: "pro_plus",
    name: "Pro Plus",
    slug: "pro_plus",
    description: "For scaling businesses with teams",
    prices: { monthly: 3.99, quarterly: 10.77, annual: 38.3 },
    pricesGHS: { monthly: 44, quarterly: 119, annual: 422 },
    features: [
      { text: "Advanced sales tracking & analytics", included: true },
      { text: "Full expense management", included: true },
      { text: "Business-level PIN security", included: true },
      { text: "Reports (PDF/Excel/CSV)", included: true },
      { text: "Priority email support (12-24h)", included: true },
      { text: "Staff management (up to 10)", included: true },
      { text: "Supplier management", included: true },
      { text: "Profit analytics & forecasting", included: true },
    ],
    limits: {
      businesses: "5 businesses",
      products: "Unlimited",
      staff: "Up to 10 staff",
      suppliers: "Unlimited",
    },
    isFeatured: true,
    cta: "Upgrade to Pro Plus",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    slug: "enterprise",
    description: "For large operations & multiple locations",
    prices: { monthly: 7.99, quarterly: 21.57, annual: 76.7 },
    pricesGHS: { monthly: 89, quarterly: 240, annual: 854 },
    features: [
      { text: "Advanced analytics & real-time forecasting", included: true },
      { text: "Real-time dashboard", included: true },
      { text: "Business-level PIN security", included: true },
      { text: "All reports (custom date ranges, bulk export)", included: true },
      { text: "Phone + Priority email support (4-8h)", included: true },
      { text: "Unlimited staff", included: true },
      { text: "Unlimited suppliers", included: true },
      { text: "API access for integrations", included: true },
    ],
    limits: {
      businesses: "Unlimited",
      products: "Unlimited",
      staff: "Unlimited",
      suppliers: "Unlimited",
    },
    isFeatured: false,
    cta: "Upgrade to Enterprise",
  },
]

type BillingCycle = "monthly" | "quarterly" | "annual"

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  return createBrowserClient(url, key)
}

export default function PricingPage() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<string>("free")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isFirstSubscription, setIsFirstSubscription] = useState(true)

  const supabase = createSupabaseClient()

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        setUserId(user.id)
        setUserEmail(user.email || null)

        // Check if user has any previous paid subscriptions
        const { data: prevSubs } = await supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", user.id)
          .neq("plan", "free")
          .limit(1)

        setIsFirstSubscription(!prevSubs || prevSubs.length === 0)

        // Get current subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, billing_cycle")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()

        if (subscription) {
          setCurrentPlan(subscription.plan)
          if (subscription.billing_cycle) {
            setBillingCycle(subscription.billing_cycle as BillingCycle)
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [supabase])

  // Get price for a plan based on billing cycle
  const getPrice = (plan: PricingPlan, cycle: BillingCycle): number => {
    return plan.prices[cycle]
  }

  // Get GHS price for Paystack
  const getPriceGHS = (plan: PricingPlan, cycle: BillingCycle): number => {
    return plan.pricesGHS[cycle]
  }

  // Get monthly equivalent for display
  const getMonthlyEquivalent = (plan: PricingPlan, cycle: BillingCycle): number => {
    if (cycle === "monthly") return plan.prices.monthly
    if (cycle === "quarterly") return plan.prices.quarterly / 3
    return plan.prices.annual / 12
  }

  // Get discount percentage
  const getDiscount = (cycle: BillingCycle): number => {
    if (cycle === "quarterly") return 10
    if (cycle === "annual") return 20
    return 0
  }

  // Handle plan selection
  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === "free" || plan.id === currentPlan) return

    setProcessingPlan(plan.id)

    // Redirect to checkout page with plan details
    const params = new URLSearchParams({
      plan: plan.slug,
      cycle: billingCycle,
      priceUSD: getPrice(plan, billingCycle).toString(),
      priceGHS: getPriceGHS(plan, billingCycle).toString(),
      firstTime: isFirstSubscription.toString(),
    })

    if (userId) params.append("userId", userId)
    if (userEmail) params.append("email", userEmail)

    router.push(`/billing/checkout?${params.toString()}`)
  }

  // Get billing cycle label
  const getCycleLabel = (cycle: BillingCycle): string => {
    switch (cycle) {
      case "monthly":
        return "/month"
      case "quarterly":
        return "/quarter"
      case "annual":
        return "/year"
    }
  }

  // Get billing cycle months
  const getCycleMonths = (cycle: BillingCycle): number => {
    switch (cycle) {
      case "monthly":
        return 1
      case "quarterly":
        return 3
      case "annual":
        return 12
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="large" text="Loading pricing plans..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="secondary" className="mb-4 text-xs sm:text-sm">
            <Gift className="h-3 w-3 mr-1" />
            First month FREE for new subscribers!
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Choose the perfect plan for your business. All plans include our core features with business-level PIN
            security.
          </p>
        </div>

        <div className="flex justify-center mb-6 sm:mb-8 px-2">
          <div className="inline-flex flex-wrap items-center justify-center bg-muted rounded-lg p-1 gap-1">
            {(["monthly", "quarterly", "annual"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  billingCycle === cycle
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cycle === "monthly" && "Monthly"}
                {cycle === "quarterly" && (
                  <span className="flex items-center gap-1">
                    Quarterly
                    <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                      Save 10%
                    </Badge>
                  </span>
                )}
                {cycle === "annual" && (
                  <span className="flex items-center gap-1">
                    Annual
                    <Badge variant="outline" className="text-[10px] sm:text-xs text-green-600 hidden sm:inline-flex">
                      Save 20%
                    </Badge>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-6 sm:hidden">
          {billingCycle === "quarterly" && (
            <Badge variant="outline" className="text-xs">
              Save 10% on Quarterly
            </Badge>
          )}
          {billingCycle === "annual" && (
            <Badge variant="outline" className="text-xs text-green-600">
              Save 20% on Annual
            </Badge>
          )}
        </div>

        {/* Removed scale transform on mobile to prevent overflow issues */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan
            const price = getPrice(plan, billingCycle)
            const monthlyEquivalent = getMonthlyEquivalent(plan, billingCycle)

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.isFeatured ? "border-primary shadow-lg sm:scale-105 order-first sm:order-none" : "border-border"
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {/* Featured Badge */}
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-2 sm:right-4 z-10">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3 sm:pb-4 pt-6">
                  <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-3 sm:px-6">
                  {/* Price Display */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-foreground">
                        ${price === 0 ? "0" : price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">{getCycleLabel(billingCycle)}</span>
                    </div>
                    {billingCycle !== "monthly" && price > 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        ${monthlyEquivalent.toFixed(2)}/month equivalent
                      </p>
                    )}
                    {isFirstSubscription && price > 0 && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        First month FREE
                      </Badge>
                    )}
                  </div>

                  {/* Limits - Made more compact on mobile */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-4 sm:mb-6 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{plan.limits.businesses}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{plan.limits.products}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{plan.limits.staff}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{plan.limits.suppliers}</span>
                    </div>
                  </div>

                  {/* Features - Smaller text on mobile */}
                  <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        {feature.included ? (
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full text-sm"
                    size="sm"
                    variant={plan.isFeatured ? "default" : isCurrentPlan ? "outline" : "secondary"}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {processingPlan === plan.id ? (
                      <LoadingSpinner size="small" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.id === "free" ? (
                      "Free Forever"
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center bg-muted/50 rounded-xl sm:rounded-2xl p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Questions?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            We're here to help you choose the right plan for your business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span>support@smartstockspro.com</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>+233 XX XXX XXXX</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4 text-green-500" /> No hidden fees
            </span>
            <span className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4 text-green-500" /> Cancel anytime
            </span>
            <span className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4 text-green-500" /> Secure payment via Paystack
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
