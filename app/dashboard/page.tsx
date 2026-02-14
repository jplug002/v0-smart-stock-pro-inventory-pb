import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import DashboardContent from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: pinVerified, error: pinError } = await supabase
    .from("session_pin_verified")
    .select("verified_at, expires_at")
    .eq("user_id", data.user.id)
    .single()

  if (pinError) {
    console.error("[v0] PIN verification check error:", pinError)
    redirect("/verify-pin")
  }

  // If no PIN verification exists or it has expired, redirect to PIN verification
  if (!pinVerified || new Date(pinVerified.expires_at) < new Date()) {
    redirect("/verify-pin")
  }

  return <DashboardContent />
}
