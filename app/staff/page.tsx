import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StaffContent from "@/components/staff/staff-content"

export default async function StaffPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <StaffContent />
}
