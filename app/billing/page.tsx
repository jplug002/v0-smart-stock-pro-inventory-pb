import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PricingPage from "@/components/pricing/pricing-page"

/**
 * BILLING PAGE
 *
 * This page displays the pricing and plans available to users.
 * It shows the 4 tiers: Free, Pro, Pro Plus, and Enterprise
 * Users can select a plan and manage their subscriptions.
 */

export default async function BillingPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <PricingPage />
    </div>
  )
}
