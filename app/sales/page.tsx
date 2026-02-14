import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SalesContent from "@/components/sales/sales-content"

export default async function SalesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <SalesContent />
}
