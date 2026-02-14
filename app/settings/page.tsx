import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SettingsContent from "@/components/settings/settings-content"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <SettingsContent />
}
