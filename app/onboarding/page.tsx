"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Building2, Loader2, Lock, LockOpen, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react"
import { BusinessPinInput } from "@/components/business/business-pin-input"

/*
 * Mandatory onboarding flow - Users must:
 * 1. Set up user PIN (handled in /onboarding/pin-setup)
 * 2. Create a business with optional 4-digit PIN
 * Then they can access the dashboard
 */
export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [step, setStep] = useState(1)

  // Business form fields
  const [businessName, setBusinessName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")

  const [enablePin, setEnablePin] = useState(false)
  const [businessPin, setBusinessPin] = useState("")
  const [confirmBusinessPin, setConfirmBusinessPin] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [pinColumnExists, setPinColumnExists] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkOnboardingStatus()
    checkPinColumnExists()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user has set up their personal PIN
      const { data: userPin } = await supabase.from("user_pin").select("*").eq("user_id", user.id).single()

      if (!userPin) {
        // If no PIN, redirect to PIN setup
        router.push("/onboarding/pin-setup")
        return
      }

      // Check if user already has a business
      const { data: businesses, error } = await supabase.from("businesses").select("*").eq("user_id", user.id).limit(1)

      if (error) throw error

      // If user has a business, redirect to dashboard
      if (businesses && businesses.length > 0) {
        router.push("/dashboard")
        return
      }

      setLoading(false)
    } catch (error) {
      console.error("Error checking onboarding status:", error)
      setLoading(false)
    }
  }

  const checkPinColumnExists = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("businesses").select("pin_hash").limit(1)

      // If error mentions column doesn't exist
      if (error && (error.message?.includes("column") || error.code === "42703")) {
        setPinColumnExists(false)
      } else {
        setPinColumnExists(true)
      }
    } catch (err) {
      console.log("[v0] PIN column check failed")
      setPinColumnExists(false)
    }
  }

  // Hash PIN using SHA-256
  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const handleNextStep = () => {
    if (!businessName.trim()) {
      setError("Business name is required")
      return
    }
    setError(null)

    // If PIN column doesn't exist, skip to creation
    if (!pinColumnExists) {
      handleCreateBusiness()
      return
    }

    setStep(2)
  }

  const handlePrevStep = () => {
    setStep(1)
    setPinError(null)
  }

  const handleCreateBusiness = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Validate PIN only if enabled
    if (enablePin && pinColumnExists) {
      if (businessPin.length !== 4) {
        setPinError("PIN must be exactly 4 digits")
        return
      }

      if (businessPin !== confirmBusinessPin) {
        setPinError("PINs do not match")
        return
      }
    }

    setCreating(true)
    setError(null)
    setPinError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // CHECK PLAN LIMIT: Check if user is on free plan and already has a business
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single()

      const plan = subscription?.plan || "free"

      if (plan === "free") {
        // Free plan: limit to 1 business
        const { count: businessCount } = await supabase
          .from("businesses")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)

        if ((businessCount || 0) >= 1) {
          setError(
            "You've reached the limit of 1 business on the Free plan. Upgrade to Pro to create more businesses."
          )
          setCreating(false)
          return
        }
      }

      // Build insert data
      const insertData: any = {
        user_id: user.id,
        name: businessName,
        address: address || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        is_default: true,
      }

      // Only add pin_hash if PIN is enabled and column exists
      if (enablePin && pinColumnExists && businessPin) {
        insertData.pin_hash = await hashPin(businessPin)
      }

      // Create the business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert(insertData)
        .select()
        .single()

      if (businessError) throw businessError

      // Set as current business in localStorage
      if (business) {
        localStorage.setItem("currentBusinessId", business.id)
        localStorage.setItem("currentBusiness", JSON.stringify(business))
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error creating business:", error)
      setError(error.message || "Failed to create business")
      setCreating(false)
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
      <Card className="w-full max-w-lg border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {step === 1 ? (
                <Building2 className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">
            {step === 1 ? "Create Your Business" : "Security Settings"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1
              ? "Let's get started by setting up your first business."
              : "Optionally add a PIN to secure this business."}
          </CardDescription>

          {/* Step indicators - only show if PIN column exists */}
          {pinColumnExists && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`w-8 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            // Step 1: Business Information
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-foreground">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g., ABC Electronics Store"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="bg-background border-input text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 54 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background border-input text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-background border-input text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-foreground">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Accra"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-foreground">
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="e.g., Ghana"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {pinColumnExists ? (
                <Button type="button" className="w-full" onClick={handleNextStep} disabled={!businessName}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => handleCreateBusiness()}
                  disabled={!businessName || creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Business
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            // Step 2: Optional PIN Setup
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  {enablePin ? (
                    <Lock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <LockOpen className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground">PIN Protection</p>
                    <p className="text-xs text-muted-foreground">
                      {enablePin ? "PIN required when switching" : "No PIN required"}
                    </p>
                  </div>
                </div>
                <Switch checked={enablePin} onCheckedChange={setEnablePin} aria-label="Enable PIN protection" />
              </div>

              {/* PIN inputs - only show if enabled */}
              {enablePin && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground text-center block mb-3">Create Business PIN</Label>
                    <BusinessPinInput value={businessPin} onChange={setBusinessPin} error={!!pinError} autoFocus />
                  </div>

                  <div>
                    <Label className="text-foreground text-center block mb-3">Confirm Business PIN</Label>
                    <BusinessPinInput
                      value={confirmBusinessPin}
                      onChange={setConfirmBusinessPin}
                      error={!!pinError}
                      autoFocus={false}
                    />
                  </div>

                  {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
                </div>
              )}

              {!enablePin && (
                <div className="text-center text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg">
                  You can always add PIN protection later from Settings.
                </div>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={creating}
                  className="flex-1 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => handleCreateBusiness()}
                  disabled={creating || (enablePin && (businessPin.length !== 4 || confirmBusinessPin.length !== 4))}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Business
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
