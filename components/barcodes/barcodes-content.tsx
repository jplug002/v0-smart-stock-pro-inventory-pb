"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Download, Scan } from "lucide-react"
import JsBarcode from "jsbarcode"

interface Product {
  id: string
  name: string
  sku: string
}

interface ProductBarcode {
  id: string
  product_id: string
  barcode_value: string
  barcode_format: string
  barcode_image_url: string | null
  created_at: string
}

export default function BarcodesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [barcodeFormat, setBarcodeFormat] = useState("CODE128")
  const [scannerActive, setScannerActive] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchProducts()
    fetchBarcodes()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("id, name, sku")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBarcodes = async () => {
    try {
      const { data, error } = await supabase
        .from("product_barcodes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setBarcodes(data || [])
    } catch (error) {
      console.error("Error fetching barcodes:", error)
    }
  }

  const generateBarcode = async () => {
    if (!selectedProduct) {
      alert("Please select a product")
      return
    }

    try {
      const product = products.find((p) => p.id === selectedProduct)
      if (!product) return

      // Generate barcode value (SKU + timestamp for uniqueness)
      const barcodeValue = `${product.sku}-${Date.now()}`

      // Check if barcode already exists for this product
      const existingBarcode = barcodes.find((b) => b.product_id === selectedProduct)
      if (existingBarcode) {
        alert("This product already has a barcode. Delete the existing one first.")
        return
      }

      const { error } = await supabase.from("product_barcodes").insert([
        {
          product_id: selectedProduct,
          barcode_value: barcodeValue,
          barcode_format: barcodeFormat,
        },
      ])

      if (error) throw error

      fetchBarcodes()
      setSelectedProduct("")
      alert("Barcode generated successfully!")
    } catch (error) {
      console.error("Error generating barcode:", error)
      alert("Failed to generate barcode")
    }
  }

  const downloadBarcode = (barcode: ProductBarcode) => {
    const product = products.find((p) => p.id === barcode.product_id)
    if (!product) return

    const canvas = document.createElement("canvas")
    JsBarcode(canvas, barcode.barcode_value, {
      format: barcode.barcode_format,
      width: 2,
      height: 100,
      displayValue: true,
    })

    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = `${product.sku}-barcode.png`
    link.click()
  }

  const deleteBarcode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this barcode?")) return

    try {
      const { error } = await supabase.from("product_barcodes").delete().eq("id", id)

      if (error) throw error
      setBarcodes(barcodes.filter((b) => b.id !== id))
    } catch (error) {
      console.error("Error deleting barcode:", error)
    }
  }

  if (loading) {
    return <div className="p-6">Loading barcodes...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Barcode Management</h1>
          <p className="text-muted-foreground mt-1">Generate and manage product barcodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Barcode Card */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Generate Barcode</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Product *</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Choose a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Barcode Format</label>
              <select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="CODE128">CODE128</option>
                <option value="EAN13">EAN13</option>
                <option value="UPC">UPC</option>
                <option value="CODE39">CODE39</option>
              </select>
            </div>

            <Button onClick={generateBarcode} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Generate Barcode
            </Button>
          </div>
        </Card>

        {/* Barcode Scanner Card */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Barcode Scanner</h2>
          <div className="space-y-4">
            <Button
              onClick={() => setScannerActive(!scannerActive)}
              variant={scannerActive ? "destructive" : "default"}
              className="w-full gap-2"
            >
              <Scan className="w-4 h-4" />
              {scannerActive ? "Stop Scanner" : "Start Scanner"}
            </Button>

            {scannerActive && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">Scanner is active. Point your barcode scanner at the screen.</p>
              </div>
            )}

            {scannedBarcode && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">Scanned: {scannedBarcode}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Barcodes Generated</p>
              <p className="text-2xl font-bold">{barcodes.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Coverage</p>
              <p className="text-2xl font-bold">
                {products.length > 0 ? Math.round((barcodes.length / products.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barcodes List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Generated Barcodes</h2>
        <div className="space-y-3">
          {barcodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No barcodes generated yet</p>
          ) : (
            barcodes.map((barcode) => {
              const product = products.find((p) => p.id === barcode.product_id)
              return (
                <div key={barcode.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <p className="font-semibold">{product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product?.sku} | Format: {barcode.barcode_format} | Value: {barcode.barcode_value}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadBarcode(barcode)} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteBarcode(barcode.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
