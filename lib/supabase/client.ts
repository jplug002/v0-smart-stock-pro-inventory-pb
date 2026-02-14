import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("[v0] Missing Supabase credentials - check your environment variables")
    throw new Error("Supabase URL and Anon Key are required")
  }

  supabaseClient = createBrowserClient(url, key)

  return supabaseClient
}
