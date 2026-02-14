import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ReportsContent from "@/components/reports/reports-content"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <ReportsContent />
}
