"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SetupPinPage() {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return
      }

      const pinHash = await hashPin(pin)

      const { error: insertError } = await supabase
        .from("user_pin")
        .upsert(
          {
            user_id: user.id,
            pin_hash: pinHash,
            is_verified: true,
          },
          { onConflict: "user_id" },
        )

      if (insertError) throw insertError

      await supabase.from("session_pin_verified").upsert(
        {
          user_id: user.id,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" },
      )

      router.push("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to setup PIN"
      setError(errorMessage)
      console.error("[v0] PIN setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Setup Security PIN</CardTitle>
            <CardDescription>Create a 4-digit PIN to secure your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupPin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="pin">Enter 4-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="0000"
                    maxLength={4}
                    pattern="\d{4}"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPin">Confirm PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="0000"
                    maxLength={4}
                    pattern="\d{4}"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Setting PIN..." : "Setup PIN"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Simple PIN hashing function (replace with bcrypt in production)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
