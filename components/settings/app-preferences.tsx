"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { TrendingUp, Sun, Moon, Monitor } from "lucide-react"

export default function AppPreferences() {
  const [theme, setTheme] = useState<string | null>(null) // null means not loaded yet
  const [currency, setCurrency] = useState("GHS")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [salesNotifications, setSalesNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const { rates, loading: ratesLoading, lastUpdated } = useExchangeRate()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme("system") // Default to system only if nothing saved
    }
  }, [])

  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      setUserId(user.id)

      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single()

      if (data) {
        // This prevents overwriting user's local choice with database value
        const savedTheme = localStorage.getItem("theme")
        if (!savedTheme && data.theme) {
          setTheme(data.theme)
        }
        setCurrency(data.currency || "GHS")
        setEmailNotifications(data.email_notifications ?? true)
        setSmsNotifications(data.sms_notifications ?? false)
        setLowStockAlerts(data.low_stock_alerts ?? true)
        setSalesNotifications(data.sales_notifications ?? true)
      }
    }
    fetchPreferences()
  }, [])

  const applyTheme = (selectedTheme: string) => {
    const root = document.documentElement

    if (selectedTheme === "dark") {
      root.classList.add("dark")
      root.style.colorScheme = "dark"
      localStorage.setItem("theme", "dark")
    } else if (selectedTheme === "light") {
      root.classList.remove("dark")
      root.style.colorScheme = "light"
      localStorage.setItem("theme", "light")
    } else if (selectedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
        root.style.colorScheme = "dark"
      } else {
        root.classList.remove("dark")
        root.style.colorScheme = "light"
      }
      localStorage.setItem("theme", "system")
    }
  }

  useEffect(() => {
    if (theme === null) return // Don't apply until loaded

    applyTheme(theme)

    // Listen for system preference changes when theme is "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => applyTheme("system")
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme) // Save immediately
    applyTheme(newTheme) // Apply immediately
  }

  const handleSave = async () => {
    if (!userId || theme === null) return

    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          theme,
          currency,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          low_stock_alerts: lowStockAlerts,
          sales_notifications: salesNotifications,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (error) throw error

      localStorage.setItem(`user_currency_${userId}`, currency)
      window.dispatchEvent(new CustomEvent("currencyChanged", { detail: { currency } }))

      toast({
        title: "Success",
        description: "Preferences saved successfully. Currency will update across all pages.",
      })

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("[v0] Preferences error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  if (theme === null) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading preferences...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Appearance</CardTitle>
          <CardDescription className="text-muted-foreground">Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme" className="text-sm font-medium text-card-foreground">
                Theme
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        theme === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            Currency
            {!ratesLoading && <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select your preferred currency for all financial displays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currency" className="text-sm font-medium text-card-foreground">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="mt-1 w-full sm:w-48 bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">Ghana Cedis (₵)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="XOF">CFA Franc (Fr)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>

              {rates && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs font-semibold text-foreground mb-2">Live Exchange Rates (vs USD)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      1 USD = <span className="font-semibold text-foreground">{rates.GHS?.toFixed(2) || "12.50"}</span>{" "}
                      GHS
                    </div>
                    <div>
                      1 USD = <span className="font-semibold text-foreground">{rates.NGN?.toFixed(2) || "1200"}</span>{" "}
                      NGN
                    </div>
                    <div>
                      1 USD = <span className="font-semibold text-foreground">{rates.GBP?.toFixed(2) || "0.79"}</span>{" "}
                      GBP
                    </div>
                    <div>
                      1 USD = <span className="font-semibold text-foreground">{rates.EUR?.toFixed(2) || "0.92"}</span>{" "}
                      EUR
                    </div>
                  </div>
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-2">Updated: {lastUpdated.toLocaleTimeString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Notifications</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-card-foreground">Email Notifications</Label>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-card-foreground">SMS Notifications</Label>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-card-foreground">Low Stock Alerts</Label>
              <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-card-foreground">Sales Notifications</Label>
              <Switch checked={salesNotifications} onCheckedChange={setSalesNotifications} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  )
}
