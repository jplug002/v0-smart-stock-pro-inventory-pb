"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Gift, Shield, Check } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

// Plan details for checkout
const PLAN_DETAILS: Record<string, { name: string; pricesGHS: Record<string, number>; features: string[] }> = {
  pro: {
    name: "Pro",
    pricesGHS: { monthly: 29, quarterly: 78, annual: 278 },
    features: ["2 businesses", "100 products", "Daily/Weekly/Monthly analytics", "PDF/CSV reports"],
  },
  pro_plus: {
    name: "Pro Plus",
    pricesGHS: { monthly: 44, quarterly: 119, annual: 422 },
    features: ["5 businesses", "Unlimited products", "Staff management (10)", "Full analytics & forecasting"],
  },
  enterprise: {
    name: "Enterprise",
    pricesGHS: { monthly: 89, quarterly: 240, annual: 854 },
    features: ["Unlimited everything", "API access", "Phone support (4-8h)", "Real-time dashboard"],
  },
}

// Separate component that uses useSearchParams
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isFirstSubscription, setIsFirstSubscription] = useState(true)

  // Get plan and cycle from URL params
  const planSlug = searchParams.get("plan") || "pro"
  const billingCycle = (searchParams.get("cycle") || "monthly") as "monthly" | "quarterly" | "annual"

  const plan = PLAN_DETAILS[planSlug]
  const priceGHS = plan?.pricesGHS[billingCycle] || 0

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login?redirect=/billing")
        return
      }
      setUserId(user.id)
      setUserEmail(user.email || null)

      // Check for first-time subscription
      const { data: prevSubs } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .neq("plan", "free")
        .limit(1)

      setIsFirstSubscription(!prevSubs || prevSubs.length === 0)
    }
    fetchUser()
  }, [])

  // Handle Paystack payment
  const handlePayment = async () => {
    if (!userId || !userEmail || !plan) return

    setLoading(true)

    try {
      const amountKobo = priceGHS * 100
      const reference = `SS_${userId.substring(0, 8)}_${Date.now()}`

      // Store transaction
      await supabase.from("paystack_transactions").insert({
        user_id: userId,
        reference,
        amount: priceGHS,
        currency: "GHS",
        status: "pending",
      })

      // Initialize Paystack
      // @ts-ignore
      const handler = window.PaystackPop?.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxx",
        email: userEmail,
        amount: amountKobo,
        currency: "GHS",
        ref: reference,
        metadata: {
          user_id: userId,
          plan: planSlug,
          billing_cycle: billingCycle,
          is_first_subscription: isFirstSubscription,
        },
        callback: async (response: { reference: string }) => {
          // Update transaction and subscription
          await supabase
            .from("paystack_transactions")
            .update({ status: "success", updated_at: new Date().toISOString() })
            .eq("reference", response.reference)

          // Calculate dates
          const startDate = new Date()
          const expiryDate = new Date()

          if (isFirstSubscription) {
            expiryDate.setMonth(expiryDate.getMonth() + 1)
          }

          if (billingCycle === "monthly") expiryDate.setMonth(expiryDate.getMonth() + 1)
          else if (billingCycle === "quarterly") expiryDate.setMonth(expiryDate.getMonth() + 3)
          else expiryDate.setFullYear(expiryDate.getFullYear() + 1)

          // Update subscription
          const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", userId).single()

          if (existingSub) {
            await supabase
              .from("subscriptions")
              .update({
                plan: planSlug,
                status: "active",
                billing_cycle: billingCycle,
                start_date: startDate.toISOString().split("T")[0],
                expiry_date: expiryDate.toISOString().split("T")[0],
                is_trial: isFirstSubscription,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingSub.id)
          } else {
            await supabase.from("subscriptions").insert({
              user_id: userId,
              plan: planSlug,
              status: "active",
              billing_cycle: billingCycle,
              start_date: startDate.toISOString().split("T")[0],
              expiry_date: expiryDate.toISOString().split("T")[0],
              is_trial: isFirstSubscription,
            })
          }

          router.push("/billing?success=true")
        },
        onClose: () => {
          setLoading(false)
        },
      })

      if (handler) {
        handler.openIframe()
      }
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      setLoading(false)
    }
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid plan selected</p>
            <Button asChild className="mt-4">
              <Link href="/billing">Back to Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js" async />

      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </Link>

        {/* Checkout Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Your Purchase
            </CardTitle>
            <CardDescription>You're upgrading to {plan.name}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.name} Plan</h3>
                  <p className="text-sm text-muted-foreground capitalize">{billingCycle} billing</p>
                </div>
                <Badge className="bg-primary">{plan.name}</Badge>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* First Month Free Banner */}
            {isFirstSubscription && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Gift className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-medium text-emerald-600">First Month FREE!</p>
                  <p className="text-sm text-muted-foreground">
                    As a first-time subscriber, your first month is on us.
                  </p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {plan.name} ({billingCycle})
                </span>
                <span className="text-foreground">GHS {priceGHS.toFixed(2)}</span>
              </div>
              {isFirstSubscription && (
                <div className="flex justify-between text-sm mb-2 text-emerald-600">
                  <span>First month discount</span>
                  <span>
                    -GHS{" "}
                    {(priceGHS / (billingCycle === "monthly" ? 1 : billingCycle === "quarterly" ? 3 : 12)).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border mt-2">
                <span className="text-foreground">Total Due Today</span>
                <span className="text-foreground">GHS {priceGHS.toFixed(2)}</span>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by Paystack</span>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="small" />
                  Processing...
                </span>
              ) : (
                `Pay GHS ${priceGHS.toFixed(2)}`
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  )
}
