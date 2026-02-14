"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Plus, Printer, X, Download, TrendingUp, Calendar, CalendarDays } from "lucide-react"
import SalesForm from "./sales-form"
import { useCurrency } from "@/hooks/use-currency"
import { LoaderWithProgress } from "@/components/ui/loading-spinner"

// Interface for sale records
interface Sale {
  id: string
  product_id: string
  quantity_sold: number
  unit_price: number
  total_amount: number
  sale_date: string
  notes: string | null
  created_at: string
  product_name?: string
}

export default function SalesContent() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [dailySales, setDailySales] = useState({ count: 0, revenue: 0 })
  const [weeklySales, setWeeklySales] = useState({ count: 0, revenue: 0 })
  const [monthlySales, setMonthlySales] = useState({ count: 0, revenue: 0 })
  const [businessName, setBusinessName] = useState("SmartStocks Pro")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    const storedBusinessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(storedBusinessId)

    fetchSales(storedBusinessId)
    fetchBusinessName(storedBusinessId)

    const setupSubscription = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const subscription = supabase
          .channel(`sales:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "sales",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchSales(storedBusinessId)
            },
          )
          .subscribe()

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("[v0] Subscription setup error:", error)
      }
    }

    setupSubscription()

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchSales(newBusinessId)
      fetchBusinessName(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    return () => {
      window.removeEventListener("businessChanged", handleBusinessChange)
    }
  }, [])

  const fetchBusinessName = async (businessId: string | null) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase.from("businesses").select("name, phone, address").eq("user_id", user.id)

      if (businessId) {
        query = query.eq("id", businessId)
      }

      const { data: business, error } = await query.single()

      if (error) {
        console.error("[v0] Error fetching business:", error)
        return
      }

      if (business?.name) setBusinessName(business.name)
      if (business?.phone) setBusinessPhone(business.phone)
      if (business?.address) setBusinessAddress(business.address)
    } catch (error) {
      console.error("[v0] Error fetching business name:", error)
    }
  }

  // Function to calculate time-based sales metrics
  const calculateTimePeriodSales = (salesData: Sale[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1)

    // Calculate daily sales (today)
    const dailySalesData = salesData.filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      return saleDate >= today
    })

    // Calculate weekly sales (last 7 days)
    const weeklySalesData = salesData.filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      return saleDate >= weekAgo
    })

    // Calculate monthly sales (current month)
    const monthlySalesData = salesData.filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      return saleDate >= monthAgo
    })

    setDailySales({
      count: dailySalesData.length,
      revenue: dailySalesData.reduce((sum, s) => sum + s.total_amount, 0),
    })

    setWeeklySales({
      count: weeklySalesData.length,
      revenue: weeklySalesData.reduce((sum, s) => sum + s.total_amount, 0),
    })

    setMonthlySales({
      count: monthlySalesData.length,
      revenue: monthlySalesData.reduce((sum, s) => sum + s.total_amount, 0),
    })
  }

  const fetchSales = async (businessId: string | null) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let salesQuery = supabase
        .from("sales")
        .select("*")
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false })

      if (businessId) {
        salesQuery = salesQuery.eq("business_id", businessId)
      }

      const { data: salesData, error: salesError } = await salesQuery

      if (salesError) throw salesError

      let productsQuery = supabase.from("products").select("id, name").eq("user_id", user.id)
      if (businessId) {
        productsQuery = productsQuery.eq("business_id", businessId)
      }

      const { data: productsData } = await productsQuery

      const productMap = new Map(productsData?.map((p) => [p.id, p.name]) || [])

      const enrichedSales = (salesData || []).map((sale) => ({
        ...sale,
        product_name: productMap.get(sale.product_id) || "Unknown",
      }))

      setSales(enrichedSales)
      setTotalRevenue(enrichedSales.reduce((sum, s) => sum + s.total_amount, 0))
      calculateTimePeriodSales(enrichedSales)
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("sales").delete().eq("id", id)

      if (error) throw error
      setSales(sales.filter((s) => s.id !== id))
      setTotalRevenue(sales.filter((s) => s.id !== id).reduce((sum, s) => sum + s.total_amount, 0))
    } catch (error) {
      console.error("Error deleting sale:", error)
    }
  }

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale)
    setShowReceiptModal(true)
  }

  const handlePrintFromModal = () => {
    if (!receiptRef.current) return

    const printContent = receiptRef.current.innerHTML
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
            @media print { body { margin: 0; padding: 10px; } }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadReceipt = () => {
    if (!selectedSale) return

    const receiptText = `
========================================
            ${businessName}
${businessAddress ? `        ${businessAddress}` : ""}
${businessPhone ? `        Tel: ${businessPhone}` : ""}
========================================

Receipt #: ${selectedSale.id.slice(0, 8).toUpperCase()}
Date: ${new Date(selectedSale.sale_date).toLocaleString()}

----------------------------------------
ITEMS
----------------------------------------
${selectedSale.product_name}
  Qty: ${selectedSale.quantity_sold} x ${formatPrice(selectedSale.unit_price)}
  Total: ${formatPrice(selectedSale.total_amount)}

----------------------------------------
TOTAL: ${formatPrice(selectedSale.total_amount)}
----------------------------------------

${selectedSale.notes ? `Notes: ${selectedSale.notes}\n` : ""}
Thank you for your business!
========================================
    `.trim()

    const blob = new Blob([receiptText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${selectedSale.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFormClose = () => {
    setShowForm(false)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchSales(currentBusinessId)
  }

  if (showForm) {
    return <SalesForm onClose={handleFormClose} onSuccess={handleFormSuccess} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sales</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Record and track sales</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Record Sale
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(dailySales.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dailySales.count} {dailySales.count === 1 ? "transaction" : "transactions"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                <CalendarDays className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(weeklySales.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {weeklySales.count} {weeklySales.count === 1 ? "transaction" : "transactions"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(monthlySales.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlySales.count} {monthlySales.count === 1 ? "transaction" : "transactions"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sales.length}</div>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(sales.length > 0 ? totalRevenue / sales.length : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoaderWithProgress progress={50} />
              <p className="text-muted-foreground mt-4">Loading sales data...</p>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No sales recorded yet</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Record First Sale
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {sales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-foreground">{sale.product_name}</p>
                        <p className="text-sm text-muted-foreground">{new Date(sale.sale_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-lg text-foreground">{formatPrice(sale.total_amount)}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                      <span>Qty: {sale.quantity_sold}</span>
                      <span>@ {formatPrice(sale.unit_price)}</span>
                    </div>
                    {sale.notes && <p className="text-xs text-muted-foreground mb-3 truncate">Note: {sale.notes}</p>}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(sale)}
                        className="flex-1 gap-1"
                      >
                        <Printer className="w-4 h-4" />
                        Receipt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Unit Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm text-foreground font-medium">{sale.product_name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{sale.quantity_sold}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatPrice(sale.unit_price)}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {formatPrice(sale.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{sale.notes || "-"}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReceipt(sale)}
                          className="text-primary hover:text-primary gap-1"
                        >
                          <Printer className="w-4 h-4" />
                          Receipt
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sale.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {showReceiptModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Receipt</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowReceiptModal(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} className="p-4 font-mono text-sm bg-white text-black">
              <div className="text-center border-b-2 border-dashed pb-3 mb-3">
                <h2 className="font-bold text-lg">{businessName}</h2>
                {businessAddress && <p className="text-xs">{businessAddress}</p>}
                {businessPhone && <p className="text-xs">Tel: {businessPhone}</p>}
              </div>

              <div className="text-center mb-3">
                <p className="text-xs">Receipt #{selectedSale.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs">{new Date(selectedSale.sale_date).toLocaleString()}</p>
              </div>

              <div className="border-t border-dashed pt-3 mb-3">
                <div className="flex justify-between">
                  <span className="font-medium">{selectedSale.product_name}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {selectedSale.quantity_sold} x {formatPrice(selectedSale.unit_price)}
                  </span>
                  <span>{formatPrice(selectedSale.total_amount)}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed pt-3 mb-3">
                <div className="flex justify-between font-bold">
                  <span>TOTAL</span>
                  <span>{formatPrice(selectedSale.total_amount)}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="text-xs text-gray-600 mb-3">
                  <strong>Notes:</strong> {selectedSale.notes}
                </div>
              )}

              <div className="text-center text-xs text-gray-500 mt-4">
                <p>Thank you for your business!</p>
                <p>Please keep this receipt for your records</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button onClick={handlePrintFromModal} className="flex-1 gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1 gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
