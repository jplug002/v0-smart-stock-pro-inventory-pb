"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2 } from "lucide-react"

/*
 * PIN Setup Page - Users must set a 4-digit PIN before creating their business
 * PIN is hashed and stored securely in the user_pin table
 */
export default function PinSetupPage() {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkPinStatus()
  }, [])

  const checkPinStatus = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user already has a PIN set up
      const { data: existingPin } = await supabase.from("user_pin").select("*").eq("user_id", user.id).single()

      // If PIN already exists, redirect to business onboarding
      if (existingPin) {
        router.push("/onboarding")
        return
      }

      setLoading(false)
    } catch (error) {
      console.error("Error checking PIN status:", error)
      setLoading(false)
    }
  }

  const hashPin = async (pinValue: string): Promise<string> => {
    // Simple hash using SHA-256 (for demonstration; use bcrypt on server in production)
    const encoder = new TextEncoder()
    const data = encoder.encode(pinValue)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (pin !== confirmPin) {
      setError("PIN codes do not match")
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const pinHash = await hashPin(pin)

      const { error: insertError } = await supabase.from("user_pin").insert({
        user_id: user.id,
        pin_hash: pinHash,
        is_verified: true,
      })

      if (insertError) throw insertError

      // Redirect to business onboarding
      router.push("/onboarding")
    } catch (error: any) {
      console.error("Error setting PIN:", error)
      setError(error.message || "Failed to set PIN")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Secure Your Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up a 4-digit PIN to protect your account and approve important actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPin} className="space-y-4">
            <div>
              <Label htmlFor="pin" className="text-foreground">
                Enter PIN <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPassword ? "text" : "password"}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  className="bg-background border-input text-foreground text-center text-2xl tracking-widest"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Must be 4 digits (0-9)</p>
            </div>

            <div>
              <Label htmlFor="confirmPin" className="text-foreground">
                Confirm PIN <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPin"
                  type={showPassword ? "text" : "password"}
                  placeholder="1234"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  className="bg-background border-input text-foreground text-center text-2xl tracking-widest"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPin"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showPin" className="text-sm text-muted-foreground cursor-pointer">
                Show PIN
              </Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={saving || pin.length !== 4 || confirmPin.length !== 4}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting PIN...
                </>
              ) : (
                "Continue to Business Setup"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You will need this PIN to verify important account actions. Keep it safe and do not share it.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
