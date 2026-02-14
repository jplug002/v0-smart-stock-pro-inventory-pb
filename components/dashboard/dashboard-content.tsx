"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  AlertCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Menu,
  X,
  TrendingDown,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import UserMenu from "@/components/navigation/user-menu"
import { useCurrency } from "@/hooks/use-currency"
import { useBusiness } from "@/hooks/use-business"
import BusinessSwitcher from "@/components/business/business-switcher"
import { LoaderWithProgress } from "@/components/ui/loading-spinner"

interface DashboardStats {
  totalProducts: number
  totalSales: number
  inventoryValue: number
  grossProfit: number
  netProfit: number
  totalRevenue: number
  totalExpenses: number
  staffSalaries: number
  lowStockItems: number
  weeklyData: Array<{ day: string; sales: number; revenue: number }>
}

export default function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { currency, formatPrice, getSymbol } = useCurrency()
  const router = useRouter()
  const { currentBusiness, loading: businessLoading } = useBusiness()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUserId(user.id)
        setUserEmail(user.email || null)

        try {
          const { data: prefs } = await supabase
            .from("user_preferences")
            .select("theme")
            .eq("user_id", user.id)
            .single()
          if (prefs) {
            if (prefs.theme === "dark") {
              document.documentElement.classList.add("dark")
            } else {
              document.documentElement.classList.remove("dark")
            }
          }
        } catch (prefError) {
          // Silently fall back to default theme if preferences unavailable
          console.log("[v0] Theme preferences fetch failed, using default")
        }

        let productsQuery = supabase.from("products").select("*").eq("user_id", user.id)
        let salesQuery = supabase.from("sales").select("*").eq("user_id", user.id)
        let expensesQuery = supabase.from("expenses").select("*").eq("user_id", user.id)
        let staffQuery = supabase.from("staff").select("*").eq("user_id", user.id)

        if (currentBusiness?.id) {
          productsQuery = productsQuery.eq("business_id", currentBusiness.id)
          salesQuery = salesQuery.eq("business_id", currentBusiness.id)
          expensesQuery = expensesQuery.eq("business_id", currentBusiness.id)
          staffQuery = staffQuery.eq("business_id", currentBusiness.id)
        }

        const { data: products } = await productsQuery
        const { data: sales } = await salesQuery
        const { data: expenses } = await expensesQuery
        const { data: staff } = await staffQuery

        const totalProducts = products?.length || 0
        const totalSales = sales?.length || 0
        const inventoryValue =
          products?.reduce((sum, p) => sum + (p.quantity_in_stock || 0) * (p.unit_price || 0), 0) || 0

        const totalRevenue = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

        // Calculate COGS (Cost of Goods Sold) from products sold
        const cogs =
          sales?.reduce((sum, sale) => {
            const product = products?.find((p) => p.id === sale.product_id)
            const costPrice = product?.cost_price || 0
            return sum + costPrice * (sale.quantity_sold || 0)
          }, 0) || 0

        const grossProfit = totalRevenue - cogs

        const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
        const staffSalaries = staff?.reduce((sum, s) => sum + (s.salary || 0), 0) || 0
        const netProfit = grossProfit - totalExpenses - staffSalaries

        const lowStockItems = products?.filter((p) => (p.quantity_in_stock || 0) <= (p.reorder_level || 0)).length || 0

        const weeklyData = generateWeeklyData(sales || [])

        setStats({
          totalProducts,
          totalSales,
          inventoryValue,
          grossProfit,
          netProfit,
          totalRevenue,
          totalExpenses,
          staffSalaries,
          lowStockItems,
          weeklyData,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!businessLoading) {
      fetchDashboardData()
    }
  }, [router, currentBusiness, businessLoading])

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          try {
            const { data: prefs } = await supabase
              .from("user_preferences")
              .select("theme")
              .eq("user_id", user.id)
              .single()

            if (prefs) {
              if (prefs.theme === "dark") {
                document.documentElement.classList.add("dark")
              } else {
                document.documentElement.classList.remove("dark")
              }
            }
          } catch (error) {
            console.log("[v0] Theme preferences unavailable, using default theme")
          }
        }
      } catch (error) {
        console.error("[v0] Error loading theme preferences:", error)
      }
    }

    loadData()
  }, [])

  const generateWeeklyData = (sales: any[]) => {
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const daySales = sales.filter((s) => {
        const saleDate = new Date(s.sale_date)
        return saleDate >= dayStart && saleDate <= dayEnd
      })

      const salesCount = daySales.length
      const revenue = daySales.reduce((sum, s) => sum + s.total_amount, 0)

      return {
        day: dayName,
        sales: salesCount,
        revenue: Math.round(revenue * 100) / 100,
      }
    })

    return weeklyData
  }

  const currencySymbol = getSymbol(currency)

  if (loading || businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <LoaderWithProgress progress={75} />
          <p className="text-muted-foreground mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">SmartStocks Pro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Inventory Management Dashboard</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <BusinessSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav className="hidden md:flex gap-4 lg:gap-6">
              <Link
                href="/dashboard"
                className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/products"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Products
              </Link>
              <Link
                href="/sales"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Sales
              </Link>
              <Link
                href="/suppliers"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Suppliers
              </Link>
              <Link
                href="/expenses"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Expenses
              </Link>
              <Link
                href="/reports"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Reports
              </Link>
              <Link
                href="/notifications"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Notifications
              </Link>
              <Link
                href="/staff"
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Staff
              </Link>
            </nav>
            <UserMenu userEmail={userEmail || undefined} />
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden bg-accent/50 border-t border-border px-4 py-3 space-y-2">
            <Link href="/dashboard" className="block px-3 py-2 text-primary hover:bg-accent rounded transition-colors">
              Dashboard
            </Link>
            <Link
              href="/products"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Products
            </Link>
            <Link
              href="/sales"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Sales
            </Link>
            <Link
              href="/suppliers"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Suppliers
            </Link>
            <Link
              href="/expenses"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Expenses
            </Link>
            <Link
              href="/reports"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Reports
            </Link>
            <Link
              href="/notifications"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Notifications
            </Link>
            <Link
              href="/staff"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded transition-colors"
            >
              Staff
            </Link>
            <Link
              href="/settings"
              className="block px-3 py-2 text-muted-foreground hover:bg-accent rounded font-medium border-t border-border mt-2 transition-colors"
            >
              Settings
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {currentBusiness && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              <span className="font-semibold">Current Business:</span> {currentBusiness.name}
              {currentBusiness.city && ` • ${currentBusiness.city}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Gross Profit */}
          <Link href="/sales" className="no-underline">
            <Card className="border-border hover:shadow-lg transition-all duration-200 hover:border-success/50 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-success transition-colors">
                  Gross Profit
                </CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-success transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${(stats?.grossProfit || 0) >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatPrice(stats?.grossProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Revenue - COGS</p>
              </CardContent>
            </Card>
          </Link>

          {/* Net Profit */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <DollarSign className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? "text-success" : "text-destructive"}`}
              >
                {formatPrice(stats?.netProfit || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">After all expenses</p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Link href="/sales" className="no-underline">
            <Card className="border-border hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Total Revenue
                </CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatPrice(stats?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total sales income</p>
              </CardContent>
            </Card>
          </Link>

          {/* Expenses */}
          <Link href="/expenses" className="no-underline">
            <Card className="border-border hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Expenses
                </CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatPrice(stats?.totalExpenses || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Operating costs</p>
              </CardContent>
            </Card>
          </Link>

          {/* Total Products */}
          <Link href="/products" className="block">
            <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">In inventory</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/sales">
            <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">{stats?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground">Click to record sales</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{formatPrice(stats?.inventoryValue || 0)}</div>
              <p className="text-xs text-muted-foreground">Total stock value</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Staff Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{formatPrice(stats?.staffSalaries || 0)}</div>
              <p className="text-xs text-muted-foreground">Total salaries</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl text-foreground">Weekly Sales Overview</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Sales and revenue trends for the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80 min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weeklyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales Count" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--success))"
                      name={`Revenue (${currencySymbol})`}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">Items below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive mb-4">{stats?.lowStockItems || 0}</div>
              <Link href="/products">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">View Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/products">
            <Button className="w-full bg-card hover:bg-accent text-foreground border border-border" variant="outline">
              Manage Products
            </Button>
          </Link>
          <Link href="/sales">
            <Button className="w-full bg-card hover:bg-accent text-foreground border border-border" variant="outline">
              Record Sale
            </Button>
          </Link>
          <Link href="/reports">
            <Button className="w-full bg-card hover:bg-accent text-foreground border border-border" variant="outline">
              View Reports
            </Button>
          </Link>
          <Link href="/notifications">
            <Button className="w-full bg-card hover:bg-accent text-foreground border border-border" variant="outline">
              Notifications
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
