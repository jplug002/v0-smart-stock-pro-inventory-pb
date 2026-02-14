"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function AccountSettings() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currency, setCurrency] = useState("USD")
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
        // Fetch user preferences
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("currency")
          .eq("user_id", user.id)
          .single()
        if (prefs) {
          setCurrency(prefs.currency || "USD")
        }
      }
    }
    fetchUser()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully",
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        currency: newCurrency,
      })

      if (error) throw error

      localStorage.setItem(`user_currency_${user.id}`, newCurrency)

      toast({
        title: "Success",
        description: `Currency changed to ${newCurrency}`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input type="email" value={email} disabled className="mt-1 bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
