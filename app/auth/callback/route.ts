import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const { data: businesses } = await supabase.from("businesses").select("id").eq("user_id", data.user.id).limit(1)

      // If no business exists, redirect to onboarding
      if (!businesses || businesses.length === 0) {
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }

      // Check if user has PIN set up
      const { data: pinData } = await supabase.from("user_pin").select("id").eq("user_id", data.user.id).maybeSingle()

      // Redirect to PIN setup if user doesn't have one yet
      if (!pinData) {
        return NextResponse.redirect(new URL("/auth/setup-pin", request.url))
      }
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
