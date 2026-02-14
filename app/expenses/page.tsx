import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ExpensesContent from "@/components/expenses/expenses-content"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <ExpensesContent />
}
