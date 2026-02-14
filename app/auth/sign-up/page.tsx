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

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (phoneNumber && !/^[+]?[\d\s-]{10,15}$/.test(phoneNumber.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number")
      setIsLoading(false)
      return
    }

    try {
      let redirectUrl = "/auth/callback"

      if (typeof window !== "undefined") {
        // On client side, use the current domain (works for both old and custom domains)
        redirectUrl = `${window.location.origin}/auth/callback`
      } else if (process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL) {
        // On server side, use the environment variable if set
        redirectUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            phone_number: phoneNumber,
          },
        },
      })
      if (error) throw error

      if (data.user && !data.session) {
        setError("Account created successfully! Please check your email to confirm your account before logging in.")
        setIsLoading(false)
        return
      }

      if (data.user && phoneNumber) {
        await supabase.from("user_preferences").upsert(
          {
            user_id: data.user.id,
            phone_number: phoneNumber,
          },
          { onConflict: "user_id" },
        )
      }

      if (data.session) {
        router.push("/onboarding")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">SmartStocks Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">Inventory Management System</p>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Create Account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign up to get started with SmartStocks Pro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233 54 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-input text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Optional - for business contact purposes</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-foreground">
                      Confirm Password
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
