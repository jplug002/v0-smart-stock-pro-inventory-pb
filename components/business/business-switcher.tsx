"use client"

// Business Switcher Component
// Allows users to switch between multiple businesses and create new ones
// Supports optional PIN protection per business

import { useState, useEffect } from "react"
import { useBusiness, type Business } from "@/hooks/use-business"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Store,
  Loader2,
  Lock,
  LockOpen,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react"
import { BusinessPinInput } from "@/components/business/business-pin-input"
import { createClient } from "@/lib/supabase/client"

export default function BusinessSwitcher() {
  const { businesses, currentBusiness, loading, switchBusiness, refreshBusinesses } = useBusiness()
  const { toast } = useToast()

  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPinVerifyDialog, setShowPinVerifyDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [createStep, setCreateStep] = useState(1)

  // New business form state
  const [newBusinessName, setNewBusinessName] = useState("")
  const [newBusinessAddress, setNewBusinessAddress] = useState("")
  const [newBusinessCity, setNewBusinessCity] = useState("")
  const [newBusinessCountry, setNewBusinessCountry] = useState("")
  const [newBusinessPhone, setNewBusinessPhone] = useState("")

  const [enablePin, setEnablePin] = useState(false)
  const [newBusinessPin, setNewBusinessPin] = useState("")
  const [confirmNewBusinessPin, setConfirmNewBusinessPin] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)

  // PIN verification states
  const [targetBusiness, setTargetBusiness] = useState<Business | null>(null)
  const [verifyPin, setVerifyPin] = useState("")
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [pinColumnExists, setPinColumnExists] = useState<boolean | null>(null)

  const [businessPinStatus, setBusinessPinStatus] = useState<Record<string, boolean>>({})

  // Check if pin_hash column exists on mount
  useEffect(() => {
    checkPinColumnAndBusinesses()
  }, [businesses])

  const checkPinColumnAndBusinesses = async () => {
    try {
      const supabase = createClient()

      // Try to select pin_hash to check if column exists
      const { data, error } = await supabase.from("businesses").select("id, pin_hash").limit(50)

      if (error) {
        // If error mentions column doesn't exist
        if (error.message?.includes("column") || error.code === "42703") {
          setPinColumnExists(false)
          return
        }
        throw error
      }

      setPinColumnExists(true)

      // Build map of which businesses have PINs
      const pinStatus: Record<string, boolean> = {}
      data?.forEach((b: any) => {
        pinStatus[b.id] = !!b.pin_hash
      })
      setBusinessPinStatus(pinStatus)
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

  // Handle switching to a business
  const handleSwitchBusiness = async (business: Business) => {
    if (business.id === currentBusiness?.id) return

    // If PIN column doesn't exist, switch directly
    if (!pinColumnExists) {
      await performSwitch(business)
      return
    }

    // Check if this business has a PIN
    if (businessPinStatus[business.id]) {
      // Business has PIN, show verification dialog
      setTargetBusiness(business)
      setVerifyPin("")
      setVerifyError(null)
      setShowPinVerifyDialog(true)
    } else {
      // No PIN, switch directly
      await performSwitch(business)
    }
  }

  // Verify PIN and switch
  const handleVerifyAndSwitch = async () => {
    if (!targetBusiness || verifyPin.length !== 4) return

    setVerifying(true)
    setVerifyError(null)

    try {
      const supabase = createClient()
      const { data: businessData } = await supabase
        .from("businesses")
        .select("pin_hash")
        .eq("id", targetBusiness.id)
        .single()

      const hashedInput = await hashPin(verifyPin)

      if (hashedInput !== businessData?.pin_hash) {
        setVerifyError("Incorrect PIN. Please try again.")
        setVerifying(false)
        return
      }

      // PIN verified, switch business
      await performSwitch(targetBusiness)
      setShowPinVerifyDialog(false)
    } catch (error: any) {
      setVerifyError("Failed to verify PIN")
    } finally {
      setVerifying(false)
    }
  }

  // Perform the actual business switch
  const performSwitch = async (business: Business) => {
    await switchBusiness(business.id)

    window.dispatchEvent(new CustomEvent("businessChanged", { detail: { businessId: business.id } }))

    toast({
      title: "Business Switched",
      description: `Now viewing ${business.name}`,
    })

    window.location.reload()
  }

  // Move to step 2 (optional PIN setup)
  const handleNextCreateStep = () => {
    if (!newBusinessName.trim()) {
      toast({
        title: "Error",
        description: "Business name is required",
        variant: "destructive",
      })
      return
    }

    // If PIN column doesn't exist, skip PIN step and create directly
    if (!pinColumnExists) {
      handleCreateBusiness()
      return
    }

    setCreateStep(2)
  }

  // Create new business
  const handleCreateBusiness = async () => {
    // Validate PIN if enabled
    if (enablePin && pinColumnExists) {
      if (newBusinessPin.length !== 4) {
        setPinError("PIN must be exactly 4 digits")
        return
      }

      if (newBusinessPin !== confirmNewBusinessPin) {
        setPinError("PINs do not match")
        return
      }
    }

    setCreating(true)
    setPinError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Build insert data
      const insertData: any = {
        user_id: user.id,
        name: newBusinessName,
        address: newBusinessAddress || null,
        city: newBusinessCity || null,
        country: newBusinessCountry || null,
        phone: newBusinessPhone || null,
        is_default: businesses.length === 0,
      }

      // Only add pin_hash if PIN is enabled and column exists
      if (enablePin && pinColumnExists && newBusinessPin) {
        insertData.pin_hash = await hashPin(newBusinessPin)
      }

      // Create business
      const { data: newBusiness, error: insertError } = await supabase
        .from("businesses")
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      if (newBusiness) {
        toast({
          title: "Business Created",
          description:
            enablePin && pinColumnExists
              ? `${newBusiness.name} has been created with PIN security.`
              : `${newBusiness.name} has been created successfully.`,
        })

        // Reset form
        resetCreateForm()
        setShowCreateDialog(false)

        // Switch to new business
        await switchBusiness(newBusiness.id)
        window.dispatchEvent(new CustomEvent("businessChanged", { detail: { businessId: newBusiness.id } }))
        window.location.reload()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Reset create form state
  const resetCreateForm = () => {
    setNewBusinessName("")
    setNewBusinessAddress("")
    setNewBusinessCity("")
    setNewBusinessCountry("")
    setNewBusinessPhone("")
    setEnablePin(false)
    setNewBusinessPin("")
    setConfirmNewBusinessPin("")
    setPinError(null)
    setCreateStep(1)
  }

  // Handle dialog close
  const handleCreateDialogClose = (open: boolean) => {
    if (!open) {
      resetCreateForm()
    }
    setShowCreateDialog(open)
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 bg-transparent">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[200px] bg-transparent">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate hidden sm:inline">{currentBusiness?.name || "Select Business"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Your Businesses
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {businesses.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              No businesses yet. Create one to get started.
            </div>
          ) : (
            businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => handleSwitchBusiness(business)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{business.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {pinColumnExists && businessPinStatus[business.id] && <Lock className="h-3 w-3 text-amber-500" />}
                  {currentBusiness?.id === business.id && <Check className="h-4 w-4 text-green-600 shrink-0" />}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 cursor-pointer text-blue-600"
          >
            <Plus className="h-4 w-4" />
            Create New Business
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PIN Verification Dialog */}
      <Dialog open={showPinVerifyDialog} onOpenChange={setShowPinVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Enter Business PIN
            </DialogTitle>
            <DialogDescription>
              Enter the 4-digit PIN for <strong>{targetBusiness?.name}</strong> to access this business.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <BusinessPinInput value={verifyPin} onChange={setVerifyPin} error={!!verifyError} autoFocus />
            {verifyError && <p className="text-sm text-destructive text-center mt-3">{verifyError}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPinVerifyDialog(false)} disabled={verifying}>
              Cancel
            </Button>
            <Button onClick={handleVerifyAndSwitch} disabled={verifying || verifyPin.length !== 4}>
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock Business"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Business Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCreateDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {createStep === 1 ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Create New Business
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Security Settings
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {createStep === 1
                ? "Add a new business to manage separate inventory, sales, and reports."
                : "Optionally add a 4-digit PIN to secure this business."}
            </DialogDescription>

            {/* Step indicators - only show if PIN column exists */}
            {pinColumnExists && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full ${createStep >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-6 h-0.5 ${createStep >= 2 ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${createStep >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            )}
          </DialogHeader>

          {createStep === 1 ? (
            // Step 1: Business Information
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business-name"
                  placeholder="Enter business name"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-address">Address</Label>
                <Textarea
                  id="business-address"
                  placeholder="Enter street address"
                  value={newBusinessAddress}
                  onChange={(e) => setNewBusinessAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-city">City</Label>
                  <Input
                    id="business-city"
                    placeholder="City"
                    value={newBusinessCity}
                    onChange={(e) => setNewBusinessCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-country">Country</Label>
                  <Input
                    id="business-country"
                    placeholder="Country"
                    value={newBusinessCountry}
                    onChange={(e) => setNewBusinessCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-phone">Phone</Label>
                <Input
                  id="business-phone"
                  placeholder="Enter phone number"
                  value={newBusinessPhone}
                  onChange={(e) => setNewBusinessPhone(e.target.value)}
                />
              </div>
            </div>
          ) : (
            // Step 2: Optional PIN Setup
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  {enablePin ? (
                    <Lock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <LockOpen className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">PIN Protection</p>
                    <p className="text-xs text-muted-foreground">
                      {enablePin ? "PIN required to access" : "No PIN required"}
                    </p>
                  </div>
                </div>
                <Switch checked={enablePin} onCheckedChange={setEnablePin} aria-label="Enable PIN protection" />
              </div>

              {/* PIN inputs - only show if enabled */}
              {enablePin && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-center block mb-3">Create Business PIN</Label>
                    <BusinessPinInput
                      value={newBusinessPin}
                      onChange={setNewBusinessPin}
                      error={!!pinError}
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label className="text-center block mb-3">Confirm PIN</Label>
                    <BusinessPinInput
                      value={confirmNewBusinessPin}
                      onChange={setConfirmNewBusinessPin}
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
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {createStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => handleCreateDialogClose(false)}>
                  Cancel
                </Button>
                {pinColumnExists ? (
                  <Button onClick={handleNextCreateStep} disabled={!newBusinessName.trim()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleCreateBusiness} disabled={!newBusinessName.trim() || creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Business
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCreateStep(1)} disabled={creating}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateBusiness}
                  disabled={
                    creating || (enablePin && (newBusinessPin.length !== 4 || confirmNewBusinessPin.length !== 4))
                  }
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Business
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
