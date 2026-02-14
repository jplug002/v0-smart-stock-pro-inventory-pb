import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProductsContent from "@/components/products/products-content"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <ProductsContent />
}
