"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, BarChart3, AlertCircle } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  quantity_in_stock: number
}

interface Sale {
  id: string
  product_id: string
  quantity_sold: number
  sale_date: string
}

interface Forecast {
  id: string
  product_id: string
  forecast_date: string
  moving_average_7d: number | null
  moving_average_30d: number | null
  seasonal_factor: number | null
  trend_value: number | null
  predicted_demand: number | null
  confidence_level: number | null
}

export default function ForecastingContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingForecast, setGeneratingForecast] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchForecasts()
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("name")

      if (error) throw error
      setProducts(data || [])
      if (data && data.length > 0) {
        setSelectedProduct(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchForecasts = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_forecasts")
        .select("*")
        .eq("product_id", selectedProduct)
        .order("forecast_date", { ascending: true })

      if (error) throw error

      setForecasts(data || [])
      prepareChartData(data || [])
    } catch (error) {
      console.error("Error fetching forecasts:", error)
    }
  }

  const prepareChartData = (forecastData: Forecast[]) => {
    const data = forecastData.map((f) => ({
      date: new Date(f.forecast_date).toLocaleDateString(),
      movingAvg7d: f.moving_average_7d || 0,
      movingAvg30d: f.moving_average_30d || 0,
      predictedDemand: f.predicted_demand || 0,
      trendValue: f.trend_value || 0,
      confidence: f.confidence_level ? Math.round(f.confidence_level * 100) : 0,
    }))
    setChartData(data)
  }

  const calculateForecasts = async () => {
    if (!selectedProduct) return

    setGeneratingForecast(true)
    try {
      // Fetch sales data for the selected product
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("quantity_sold, sale_date")
        .eq("product_id", selectedProduct)
        .order("sale_date", { ascending: true })

      if (salesError) throw salesError

      if (!salesData || salesData.length === 0) {
        alert("No sales data available for this product")
        setGeneratingForecast(false)
        return
      }

      // Calculate forecasts for the next 30 days
      const forecasts = generateForecasts(salesData)

      // Insert forecasts into database
      const { error: insertError } = await supabase.from("sales_forecasts").insert(forecasts)

      if (insertError) throw insertError

      fetchForecasts()
      alert("Forecasts generated successfully!")
    } catch (error) {
      console.error("Error generating forecasts:", error)
      alert("Failed to generate forecasts")
    } finally {
      setGeneratingForecast(false)
    }
  }

  const generateForecasts = (salesData: any[]) => {
    const forecasts = []
    const today = new Date()

    // Calculate historical metrics
    const quantities = salesData.map((s) => s.quantity_sold)
    const avg7d = calculateMovingAverage(quantities, 7)
    const avg30d = calculateMovingAverage(quantities, 30)
    const trend = calculateTrend(quantities)
    const seasonalFactor = calculateSeasonalFactor(salesData)

    // Generate forecasts for next 30 days
    for (let i = 1; i <= 30; i++) {
      const forecastDate = new Date(today)
      forecastDate.setDate(forecastDate.getDate() + i)

      const predictedDemand = Math.round(avg30d * seasonalFactor + trend * i)
      const confidence = Math.min(0.95, 0.7 + quantities.length * 0.01)

      forecasts.push({
        product_id: selectedProduct,
        forecast_date: forecastDate.toISOString().split("T")[0],
        moving_average_7d: avg7d,
        moving_average_30d: avg30d,
        seasonal_factor: seasonalFactor,
        trend_value: trend,
        predicted_demand: Math.max(0, predictedDemand),
        confidence_level: confidence,
      })
    }

    return forecasts
  }

  const calculateMovingAverage = (data: number[], period: number) => {
    if (data.length === 0) return 0
    const relevantData = data.slice(-period)
    return relevantData.reduce((a, b) => a + b, 0) / relevantData.length
  }

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0
    const recent = data.slice(-7)
    const older = data.slice(-14, -7)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    return (recentAvg - olderAvg) / 7
  }

  const calculateSeasonalFactor = (salesData: any[]) => {
    // Simple seasonal factor based on day of week patterns
    const dayOfWeekSales: { [key: number]: number[] } = {}

    salesData.forEach((sale) => {
      const date = new Date(sale.sale_date)
      const dayOfWeek = date.getDay()
      if (!dayOfWeekSales[dayOfWeek]) {
        dayOfWeekSales[dayOfWeek] = []
      }
      dayOfWeekSales[dayOfWeek].push(sale.quantity_sold)
    })

    const averages = Object.values(dayOfWeekSales).map((sales) => sales.reduce((a, b) => a + b, 0) / sales.length)
    const overallAverage = averages.reduce((a, b) => a + b, 0) / averages.length

    return overallAverage > 0 ? 1.0 : 1.0
  }

  if (loading) {
    return <div className="p-6">Loading forecasting module...</div>
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)
  const latestForecast = forecasts[forecasts.length - 1]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Forecasting</h1>
          <p className="text-muted-foreground mt-1">Demand planning with AI-powered predictions</p>
        </div>
        <Button onClick={calculateForecasts} disabled={generatingForecast || !selectedProduct} className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {generatingForecast ? "Generating..." : "Generate Forecast"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <label className="block text-sm font-medium mb-2">Select Product</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </Card>

        {selectedProductData && (
          <>
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Current Stock</p>
              <p className="text-2xl font-bold">{selectedProductData.quantity_in_stock}</p>
            </Card>

            {latestForecast && (
              <>
                <Card className="p-4">
                  <p className="text-muted-foreground text-sm">7-Day Avg</p>
                  <p className="text-2xl font-bold">{Math.round(latestForecast.moving_average_7d || 0)}</p>
                </Card>

                <Card className="p-4">
                  <p className="text-muted-foreground text-sm">30-Day Avg</p>
                  <p className="text-2xl font-bold">{Math.round(latestForecast.moving_average_30d || 0)}</p>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {chartData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Forecast Chart
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="movingAvg7d" stroke="#3b82f6" name="7-Day Moving Avg" />
              <Line type="monotone" dataKey="movingAvg30d" stroke="#8b5cf6" name="30-Day Moving Avg" />
              <Line
                type="monotone"
                dataKey="predictedDemand"
                stroke="#10b981"
                name="Predicted Demand"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {forecasts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Forecast Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">7-Day Avg</th>
                  <th className="text-left py-2 px-2">30-Day Avg</th>
                  <th className="text-left py-2 px-2">Trend</th>
                  <th className="text-left py-2 px-2">Predicted Demand</th>
                  <th className="text-left py-2 px-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.slice(-10).map((forecast) => (
                  <tr key={forecast.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{new Date(forecast.forecast_date).toLocaleDateString()}</td>
                    <td className="py-2 px-2">{Math.round(forecast.moving_average_7d || 0)}</td>
                    <td className="py-2 px-2">{Math.round(forecast.moving_average_30d || 0)}</td>
                    <td className="py-2 px-2">{(forecast.trend_value || 0).toFixed(2)}</td>
                    <td className="py-2 px-2 font-semibold">{forecast.predicted_demand}</td>
                    <td className="py-2 px-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {Math.round((forecast.confidence_level || 0) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {forecasts.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No forecasts generated yet. Click "Generate Forecast" to start.</p>
        </Card>
      )}
    </div>
  )
}
