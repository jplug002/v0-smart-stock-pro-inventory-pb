"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting login process...")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message === "Email not confirmed") {
          setError("Please confirm your email before logging in. Check your inbox for a confirmation link.")
        } else if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError(signInError.message)
        }
        throw signInError
      }

      console.log("[v0] Sign in successful, checking business status...")

      const { data: businesses, error: businessError } = await supabase.from("businesses").select("id").limit(1)

      if (businessError && businessError.code !== "PGRST116") {
        console.error("[v0] Error checking businesses:", businessError)
      }

      // If no business exists, redirect to mandatory onboarding
      if (!businesses || businesses.length === 0) {
        console.log("[v0] No business found, redirecting to onboarding...")
        setIsRedirecting(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push("/onboarding")
        return
      }

      console.log("[v0] Business found, checking PIN status...")

      // Check if user has PIN set up
      const { data: pinData, error: pinError } = await supabase.from("user_pin").select("id").maybeSingle()

      if (pinError && pinError.code !== "PGRST116") {
        throw pinError
      }

      // If no PIN exists, redirect to setup, otherwise go to dashboard
      if (!pinData) {
        console.log("[v0] No PIN found, redirecting to setup-pin...")
        setIsRedirecting(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push("/auth/setup-pin")
      } else {
        console.log("[v0] PIN found, redirecting to dashboard...")
        setIsRedirecting(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setIsRedirecting(false)
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      console.log("[v0] Login error:", errorMessage)
      // Error message already set above, no need to set again
      if (!error) {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">SmartStocks Pro</h1>
            <p className="text-sm text-slate-600 mt-1">Inventory Management System</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || isRedirecting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || isRedirecting}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
                    {isRedirecting ? "Redirecting..." : isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
