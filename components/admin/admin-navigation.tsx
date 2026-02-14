"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  BarChart3,
  Mail,
  ActivitySquare,
  ChevronDown,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@supabase/ssr"
import { useState } from "react"

export function AdminNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { href: "/admin/payments", label: "Payments", icon: BarChart3 },
    { href: "/admin/activity-logs", label: "Activity", icon: ActivitySquare },
    { href: "/admin/communications", label: "Messages", icon: Mail },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SS</span>
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">SmartStocks Pro</span>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Admin
              </Badge>
            </Link>
          </div>

          {/* Search bar - desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users, transactions..."
                className="pl-9 bg-muted/50 border-transparent focus:border-border"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">A</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1 -mb-px">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-none border-b-2 ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <div className="p-4 space-y-2">
            {/* Mobile search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-muted/50" />
            </div>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
