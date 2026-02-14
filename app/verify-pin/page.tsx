"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyPinPage() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (attempts >= 3) {
      setError("Too many failed attempts. Please log in again.")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: pinRecord, error: fetchError } = await supabase
        .from("user_pin")
        .select("pin_hash")
        .eq("user_id", user.id)
        .single()

      if (fetchError || !pinRecord) {
        setError("PIN not setup. Please setup PIN first.")
        return
      }

      const enteredPinHash = await hashPin(pin)

      if (enteredPinHash !== pinRecord.pin_hash) {
        setAttempts(attempts + 1)
        setError(`PIN is incorrect. ${3 - attempts - 1} attempts remaining.`)
        setPin("")
        return
      }

      const { error: upsertError } = await supabase.from("session_pin_verified").upsert(
        {
          user_id: user.id,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (upsertError) {
        console.error("[v0] Upsert error:", upsertError)
        setError("Failed to save PIN verification session")
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      router.push("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify PIN"
      setError(errorMessage)
      console.error("[v0] PIN verification error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Verify PIN</CardTitle>
            <CardDescription>Enter your 4-digit PIN to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyPin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="pin">4-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="0000"
                    maxLength={4}
                    pattern="\d{4}"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={isLoading || attempts >= 3}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || attempts >= 3}
                >
                  {isLoading ? "Verifying..." : "Verify PIN"}
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
