"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Menu, X, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import AccountSettings from "./account-settings"
import AppPreferences from "./app-preferences"
import BusinessInfo from "./business-info"
import BusinessPinManagement from "./business-pin-management" // Add BusinessPinManagement import
import SubscriptionBilling from "./subscription-billing"
import SupportHelp from "./support-help"

export default function SettingsContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("account")
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/auth/login"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">SmartStocks Pro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Settings</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav className="hidden md:flex gap-4 lg:gap-6">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground font-medium text-sm">
                Dashboard
              </Link>
              <Link href="/settings" className="text-foreground font-medium text-sm">
                Settings
              </Link>
            </nav>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-xs sm:text-sm bg-transparent"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden bg-accent/50 border-t border-border px-4 py-3 space-y-2">
            <Link href="/dashboard" className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded">
              Dashboard
            </Link>
            <Link href="/settings" className="block px-3 py-2 text-foreground hover:bg-accent rounded">
              Settings
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage your account, preferences, and billing
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border-b border-border rounded-none p-0 h-auto overflow-x-auto flex justify-start md:justify-start md:grid md:grid-cols-3 lg:grid-cols-5 mb-6">
            <TabsTrigger
              value="account"
              className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground flex-shrink-0 md:flex-shrink"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground flex-shrink-0 md:flex-shrink"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground flex-shrink-0 md:flex-shrink"
            >
              Business
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground flex-shrink-0 md:flex-shrink"
            >
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground flex-shrink-0 md:flex-shrink"
            >
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="preferences">
            <AppPreferences />
          </TabsContent>

          <TabsContent value="business">
            <div className="space-y-6">
              <BusinessInfo />
              <BusinessPinManagement />
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <SubscriptionBilling />
          </TabsContent>

          <TabsContent value="support">
            <SupportHelp />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
