"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/hooks/use-currency"
import { generateSalesPDF } from "@/lib/pdf/generate-pdf"
import EnhancedReportUI from "./enhanced-report-ui"

export default function ReportsContent() {
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { getSymbol } = useCurrency()
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const [enhancedReportData, setEnhancedReportData] = useState<{
    totalSales: number
    totalRevenue: number
    grossProfit: number
    netProfit: number
    totalExpenses: number
    totalProducts: number
    lowStockItems: number
  } | null>(null)

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
  }, [])

  useEffect(() => {
    const handleBusinessChange = () => {
      const businessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(businessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    window.addEventListener("storage", handleBusinessChange)

    return () => {
      window.removeEventListener("businessChanged", handleBusinessChange)
      window.removeEventListener("storage", handleBusinessChange)
    }
  }, [])

  useEffect(() => {
    fetchEnhancedReportData()
  }, [startDate, endDate, currentBusinessId])

  const fetchEnhancedReportData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Build queries with business filter
      let productsQuery = supabase.from("products").select("*").eq("user_id", user.id)
      let salesQuery = supabase.from("sales").select("*").eq("user_id", user.id)
      let expensesQuery = supabase.from("expenses").select("*").eq("user_id", user.id)
      let staffQuery = supabase.from("staff").select("*").eq("user_id", user.id)

      if (currentBusinessId) {
        productsQuery = productsQuery.eq("business_id", currentBusinessId)
        salesQuery = salesQuery.eq("business_id", currentBusinessId)
        expensesQuery = expensesQuery.eq("business_id", currentBusinessId)
        staffQuery = staffQuery.eq("business_id", currentBusinessId)
      }

      // Apply date filters if provided
      if (startDate && endDate) {
        salesQuery = salesQuery.gte("sale_date", startDate).lte("sale_date", endDate)
        expensesQuery = expensesQuery.gte("expense_date", startDate).lte("expense_date", endDate)
      }

      const { data: products } = await productsQuery
      const { data: sales } = await salesQuery
      const { data: expenses } = await expensesQuery
      const { data: staff } = await staffQuery

      // Calculate metrics
      const totalSales = sales?.length || 0
      const totalRevenue = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

      // Calculate COGS from product cost prices
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

      const totalProducts = products?.length || 0
      const lowStockItems = products?.filter((p) => (p.quantity_in_stock || 0) <= (p.reorder_level || 0)).length || 0

      setEnhancedReportData({
        totalSales,
        totalRevenue,
        grossProfit,
        netProfit,
        totalExpenses,
        totalProducts,
        lowStockItems,
      })
    } catch (error) {
      console.error("Error fetching enhanced report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Please log in to generate reports")
        return
      }

      const { data: businesses } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", currentBusinessId || "")
        .single()

      // Fetch sales with business filter
      let salesQuery = supabase.from("sales").select("*").eq("user_id", user.id)
      if (currentBusinessId) {
        salesQuery = salesQuery.eq("business_id", currentBusinessId)
      }
      const { data: sales, error: salesError } = await salesQuery

      if (salesError) {
        console.error("[v0] Sales fetch error:", salesError)
      }

      // Fetch products with business filter
      let productsQuery = supabase.from("products").select("*").eq("user_id", user.id)
      if (currentBusinessId) {
        productsQuery = productsQuery.eq("business_id", currentBusinessId)
      }
      const { data: products, error: productsError } = await productsQuery

      if (productsError) {
        console.error("[v0] Products fetch error:", productsError)
      }

      if (!sales || sales.length === 0) {
        console.log("[v0] No sales data found for business:", currentBusinessId)
        alert("No sales data found for this business. Please record some sales first before generating a PDF report.")
        return
      }

      console.log("[v0] PDF Generation - Sales count:", sales.length)
      console.log("[v0] PDF Generation - Products count:", products?.length || 0)

      const salesWithProducts = sales.map((sale) => {
        const product = products?.find((p) => p.id === sale.product_id)
        return {
          product_name: product?.name || "Unknown Product",
          quantity_sold: sale.quantity_sold || 0,
          unit_price: product?.selling_price || 0,
          total_amount: sale.total_amount || 0,
          cost_price: product?.cost_price || 0,
        }
      })

      const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
      const cogs = salesWithProducts.reduce((sum, s) => sum + (s.cost_price || 0) * s.quantity_sold, 0)
      const grossProfit = totalRevenue - cogs

      const reportData = {
        businessName: businesses?.name || "My Business",
        businessLocation: businesses?.location || "",
        businessPhone: businesses?.phone || "",
        ownerEmail: user.email || "",
        totalRevenue,
        totalCost: cogs,
        grossProfit,
        profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        products: salesWithProducts,
        reportDate: new Date().toISOString().split("T")[0],
        currency: "GHS", // Use user's selected currency if available
        symbol: getSymbol(),
        profitPercentage: cogs > 0 ? (grossProfit / cogs) * 100 : 0,
      }

      console.log("[v0] Calling generateSalesPDF with report data:", reportData)

      // Generate PDF using the corrected helper function
      await generateSalesPDF(reportData)
    } catch (error: any) {
      console.error("[v0] PDF generation error:", error)
      alert(`Failed to generate PDF: ${error.message || "Unknown error"}`)
    }
  }

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    if (format === "pdf") {
      handleGeneratePDF()
    } else {
      alert(`${format.toUpperCase()} export coming soon!`)
    }
  }

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">View and export comprehensive business reports</p>
        </div>
      </div>

      <EnhancedReportUI
        reportData={enhancedReportData}
        onExport={handleExport}
        onDateChange={handleDateChange}
        loading={loading}
      />
    </div>
  )
}
