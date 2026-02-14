"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Calendar, TrendingUp, DollarSign, Package, Receipt } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

interface ReportData {
  totalSales: number
  totalRevenue: number
  grossProfit: number
  netProfit: number
  totalExpenses: number
  totalProducts: number
  lowStockItems: number
}

interface EnhancedReportUIProps {
  reportData: ReportData | null
  onExport: (type: "pdf" | "csv" | "excel") => void
  onDateChange: (startDate: string, endDate: string) => void
  loading?: boolean
}

/*
 * Clean, modern report generation UI with date filters and export options
 * Displays Sales, Profit, Expense, and Inventory reports with visual cards
 */
export default function EnhancedReportUI({
  reportData,
  onExport,
  onDateChange,
  loading = false,
}: EnhancedReportUIProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf")
  const { formatPrice } = useCurrency()

  const handleDateFilter = () => {
    if (startDate && endDate) {
      onDateChange(startDate, endDate)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Filter Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Report Filters
          </CardTitle>
          <CardDescription className="text-muted-foreground">Select date range to generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-foreground">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-input text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-foreground">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border-input text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="export-format" className="text-foreground">
                Export Format
              </Label>
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="excel">Excel Workbook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleDateFilter} className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                Apply Filter
              </Button>
              <Button
                onClick={() => onExport(exportFormat)}
                variant="outline"
                className="bg-card hover:bg-accent border-border"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger
            value="sales"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="profit"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Profit
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{reportData?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Number of transactions</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{formatPrice(reportData?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total sales income</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Average Sale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(reportData?.totalSales ? (reportData.totalRevenue || 0) / reportData.totalSales : 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit Report Tab */}
        <TabsContent value="profit" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Gross Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${(reportData?.grossProfit || 0) >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatPrice(reportData?.grossProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Revenue minus COGS</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${(reportData?.netProfit || 0) >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatPrice(reportData?.netProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">After all expenses</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Report Tab */}
        <TabsContent value="expenses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{formatPrice(reportData?.totalExpenses || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Operating costs</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Expense Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {reportData?.totalRevenue
                    ? `${(((reportData.totalExpenses || 0) / reportData.totalRevenue) * 100).toFixed(1)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Of total revenue</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Report Tab */}
        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{reportData?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{reportData?.lowStockItems || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card className="border-border bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Export Report</h3>
              <p className="text-sm text-muted-foreground">Download this report in your preferred format</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onExport("pdf")}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={() => onExport("csv")}
                className="bg-success hover:bg-success/90 text-success-foreground"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={() => onExport("excel")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
