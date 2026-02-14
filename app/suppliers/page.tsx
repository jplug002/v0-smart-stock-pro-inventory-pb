import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SuppliersContent from "@/components/suppliers/suppliers-content"

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <SuppliersContent />
}
