import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function updateSession(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("[v0] Supabase env vars not loaded yet, skipping middleware")
      return NextResponse.next({ request })
    }

    const supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If we have a user, refresh the session to extend the token lifetime
    if (user) {
      await supabase.auth.refreshSession()

      const isProtectedPage =
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/onboarding") &&
        !request.nextUrl.pathname.startsWith("/email-config") &&
        !request.nextUrl.pathname.startsWith("/admin-setup") &&
        request.nextUrl.pathname !== "/"

      if (isProtectedPage) {
        // Check if user has a business
        const { data: businesses } = await supabase.from("businesses").select("id").eq("user_id", user.id).limit(1)

        // If no business exists, force redirect to onboarding
        if (!businesses || businesses.length === 0) {
          return NextResponse.redirect(new URL("/onboarding", request.url))
        }
      }
    }

    return supabaseResponse
  } catch (error) {
    console.log("[v0] Middleware error (non-fatal):", error)
    return NextResponse.next({ request })
  }
}
