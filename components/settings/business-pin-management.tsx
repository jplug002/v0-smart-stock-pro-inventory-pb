"use client"

// Business PIN Management Component
// Allows users to create, view, change, or remove their business PIN

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, LockOpen, Loader2, Check, RefreshCw, AlertTriangle, Trash2 } from "lucide-react"
import { BusinessPinInput } from "@/components/business/business-pin-input"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/hooks/use-business"
import { useToast } from "@/hooks/use-toast"

export function BusinessPinManagement() {
  const { currentBusiness, refreshBusinesses } = useBusiness()
  const { toast } = useToast()

  // State management
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasPin, setHasPin] = useState(false)

  const [pinColumnExists, setPinColumnExists] = useState<boolean | null>(null)
  const [migrationNeeded, setMigrationNeeded] = useState(false)

  // PIN form state
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Mode: 'view' | 'change' | 'create' | 'remove'
  const [mode, setMode] = useState<"view" | "change" | "create" | "remove">("view")

  // Check if business has PIN on mount
  useEffect(() => {
    checkPinStatus()
  }, [currentBusiness])

  const checkPinStatus = async () => {
    if (!currentBusiness) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("businesses").select("pin_hash").eq("id", currentBusiness.id).single()

      if (error) {
        // Check if it's a column doesn't exist error
        if (error.message?.includes("pin_hash") || error.code === "42703") {
          setPinColumnExists(false)
          setMigrationNeeded(true)
          setHasPin(false)
          setMode("create")
        } else {
          throw error
        }
      } else {
        setPinColumnExists(true)
        setMigrationNeeded(false)
        setHasPin(!!data?.pin_hash)
        setMode(data?.pin_hash ? "view" : "create")
      }
    } catch (error) {
      console.error("Error checking PIN status:", error)
    } finally {
      setLoading(false)
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

  // Verify current PIN
  const verifyCurrentPin = async (): Promise<boolean> => {
    if (!currentBusiness) return false

    const supabase = createClient()
    const { data } = await supabase.from("businesses").select("pin_hash").eq("id", currentBusiness.id).single()

    const hashedInput = await hashPin(currentPin)
    return hashedInput === data?.pin_hash
  }

  // Handle creating or changing PIN
  const handleSavePin = async () => {
    setError(null)

    // Validate new PIN
    if (newPin.length !== 4) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    setSaving(true)

    try {
      // If changing PIN, verify current PIN first
      if (mode === "change") {
        const isValid = await verifyCurrentPin()
        if (!isValid) {
          setError("Current PIN is incorrect")
          setSaving(false)
          return
        }
      }

      const supabase = createClient()
      const hashedPin = await hashPin(newPin)

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ pin_hash: hashedPin })
        .eq("id", currentBusiness?.id)

      if (updateError) throw updateError

      toast({
        title: mode === "create" ? "PIN Created" : "PIN Updated",
        description: `Your business PIN has been ${mode === "create" ? "created" : "updated"} successfully.`,
      })

      // Reset form and refresh state
      resetForm()
      setHasPin(true)
      setMode("view")
    } catch (error: any) {
      if (error.message?.includes("pin_hash")) {
        setError("Database migration needed. Please run scripts/015_business_pin_system.sql")
        setMigrationNeeded(true)
      } else {
        setError(error.message || "Failed to save PIN")
      }
    } finally {
      setSaving(false)
    }
  }

  // Handle removing PIN
  const handleRemovePin = async () => {
    setError(null)

    // Verify current PIN first
    if (currentPin.length !== 4) {
      setError("Enter your current PIN to remove it")
      return
    }

    setSaving(true)

    try {
      const isValid = await verifyCurrentPin()
      if (!isValid) {
        setError("Current PIN is incorrect")
        setSaving(false)
        return
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ pin_hash: null })
        .eq("id", currentBusiness?.id)

      if (updateError) throw updateError

      toast({
        title: "PIN Removed",
        description: "Your business PIN has been removed. Anyone can now access this business.",
      })

      // Reset form and refresh state
      resetForm()
      setHasPin(false)
      setMode("create")
    } catch (error: any) {
      setError(error.message || "Failed to remove PIN")
    } finally {
      setSaving(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setCurrentPin("")
    setNewPin("")
    setConfirmPin("")
    setError(null)
  }

  // Handle cancel
  const handleCancel = () => {
    resetForm()
    setMode(hasPin ? "view" : "create")
  }

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Lock className="h-5 w-5" />
          Business PIN Security
        </CardTitle>
        <CardDescription>
          {hasPin
            ? "Manage your business access PIN. This PIN is required when switching to this business."
            : "Create a PIN to secure your business. You'll need this PIN when switching between businesses."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {migrationNeeded && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Migration Required:</strong> Please run{" "}
              <code className="bg-slate-700 px-1 rounded">scripts/015_business_pin_system.sql</code> to enable PIN
              security.
            </AlertDescription>
          </Alert>
        )}

        {mode === "view" && hasPin ? (
          // View mode - show status and options
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">PIN Protected</p>
                  <p className="text-sm text-muted-foreground">Your business is secured with a 4-digit PIN</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode("change")} className="flex-1 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Change PIN
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("remove")}
                className="flex-1 bg-transparent text-red-500 hover:text-red-400 hover:border-red-500/50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove PIN
              </Button>
            </div>
          </div>
        ) : mode === "create" && !migrationNeeded ? (
          // Create mode - set up new PIN
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <LockOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-foreground">No PIN Set</p>
                  <p className="text-xs text-muted-foreground">Create a PIN to secure this business</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-center block mb-3">Create Business PIN</Label>
              <BusinessPinInput value={newPin} onChange={setNewPin} error={!!error} autoFocus />
            </div>

            <div>
              <Label className="text-center block mb-3">Confirm PIN</Label>
              <BusinessPinInput value={confirmPin} onChange={setConfirmPin} error={!!error} autoFocus={false} />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              onClick={handleSavePin}
              disabled={saving || newPin.length !== 4 || confirmPin.length !== 4}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating PIN...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Create PIN
                </>
              )}
            </Button>
          </div>
        ) : mode === "change" ? (
          // Change mode - enter current and new PIN
          <div className="space-y-6">
            <div>
              <Label className="text-center block mb-3">Current PIN</Label>
              <BusinessPinInput
                value={currentPin}
                onChange={setCurrentPin}
                error={!!error && error.includes("Current")}
                autoFocus
              />
            </div>

            <div>
              <Label className="text-center block mb-3">New PIN</Label>
              <BusinessPinInput
                value={newPin}
                onChange={setNewPin}
                error={!!error && !error.includes("Current")}
                autoFocus={false}
              />
            </div>

            <div>
              <Label className="text-center block mb-3">Confirm New PIN</Label>
              <BusinessPinInput
                value={confirmPin}
                onChange={setConfirmPin}
                error={!!error && error.includes("match")}
                autoFocus={false}
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleSavePin}
                disabled={saving || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update PIN
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : mode === "remove" ? (
          // Remove mode - verify PIN to remove
          <div className="space-y-6">
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">
                <strong>Warning:</strong> Removing PIN will allow anyone with access to your account to switch to this
                business without verification.
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-center block mb-3">Enter Current PIN to Confirm</Label>
              <BusinessPinInput value={currentPin} onChange={setCurrentPin} error={!!error} autoFocus />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleRemovePin}
                disabled={saving || currentPin.length !== 4}
                variant="destructive"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove PIN
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default BusinessPinManagement
