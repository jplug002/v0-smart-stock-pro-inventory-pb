"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Plus, Edit2, Trash2, AlertCircle, Tag } from "lucide-react"
import ProductForm from "./product-form"
import ProductDiscountModal from "./product-discount-modal"
import { useCurrency } from "@/hooks/use-currency"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  quantity_in_stock: number
  reorder_level: number
  unit_price: number
  cost_price: number
  supplier_id: string | null
  image_url: string | null
  description: string | null
  created_at: string
  business_id?: string // Added for multi-business support
}

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null)
  const { formatPrice } = useCurrency()

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const currentBusinessId = localStorage.getItem("currentBusinessId")

      let query = supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

      // Filter by business if one is selected
      if (currentBusinessId) {
        query = query.eq("business_id", currentBusinessId)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    // Listen for business changes
    const handleBusinessChange = () => {
      fetchProducts()
    }
    window.addEventListener("businessChanged", handleBusinessChange)

    const subscribeToProducts = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const subscription = supabase
        .channel("products-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "products", filter: `user_id=eq.${user.id}` },
          () => fetchProducts(),
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "products", filter: `user_id=eq.${user.id}` },
          () => fetchProducts(),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "products", filter: `user_id=eq.${user.id}` },
          () => fetchProducts(),
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    subscribeToProducts()

    return () => {
      window.removeEventListener("businessChanged", handleBusinessChange)
    }
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
      setProducts(products.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchProducts()
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const lowStockProducts = filteredProducts.filter((p) => p.quantity_in_stock <= p.reorder_level)

  // Total Cost Value = sum of (cost_price × quantity_in_stock) for each product
  // Total Selling Value = sum of (unit_price × quantity_in_stock) for each product
  const inventoryTotals = filteredProducts.reduce(
    (acc, product) => {
      // Use the actual stored prices - no conversion needed
      const costPrice = product.cost_price || 0
      const sellingPrice = product.unit_price || 0
      const stock = product.quantity_in_stock || 0

      // Calculate: stock × price = total value
      const totalCostValue = costPrice * stock
      const totalSellingValue = sellingPrice * stock
      const potentialProfit = totalSellingValue - totalCostValue

      return {
        totalCostValue: acc.totalCostValue + totalCostValue,
        totalSellingValue: acc.totalSellingValue + totalSellingValue,
        potentialProfit: acc.potentialProfit + potentialProfit,
        totalStock: acc.totalStock + stock,
      }
    },
    { totalCostValue: 0, totalSellingValue: 0, potentialProfit: 0, totalStock: 0 },
  )

  const overallMargin =
    inventoryTotals.totalCostValue > 0
      ? ((inventoryTotals.potentialProfit / inventoryTotals.totalCostValue) * 100).toFixed(1)
      : "0.0"

  if (showForm) {
    return <ProductForm product={editingProduct} onClose={handleFormClose} onSuccess={handleFormSuccess} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Products</h1>
              <p className="text-sm text-muted-foreground">Manage your inventory</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards - FIXED CALCULATIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost Value</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(inventoryTotals.totalCostValue)}</p>
              <p className="text-xs text-muted-foreground">{inventoryTotals.totalStock} units in stock</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Selling Value</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(inventoryTotals.totalSellingValue)}</p>
              <p className="text-xs text-muted-foreground">If all stock sold at price</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Potential Profit</p>
              <p
                className={`text-xl font-bold ${inventoryTotals.potentialProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {formatPrice(inventoryTotals.potentialProfit)}
              </p>
              <p className="text-xs text-muted-foreground">{overallMargin}% margin</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Products</p>
              <p className="text-xl font-bold text-foreground">{filteredProducts.length}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{lowStockProducts.length} low stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <AlertCircle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {lowStockProducts.length} product(s) are below reorder level
              </p>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto bg-card rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cost Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Selling Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Profit/Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const costPrice = product.cost_price || 0
                  const sellingPrice = product.unit_price || 0
                  const profitPerUnit = sellingPrice - costPrice
                  const profitMargin = costPrice > 0 ? ((profitPerUnit / costPrice) * 100).toFixed(1) : "100.0"

                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-foreground font-medium">{product.name}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{product.sku}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{product.category}</td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.quantity_in_stock <= product.reorder_level
                              ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                              : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                          }`}
                        >
                          {product.quantity_in_stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{formatPrice(costPrice)}</td>
                      <td className="px-4 py-4 text-sm text-foreground font-medium">{formatPrice(sellingPrice)}</td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`font-medium ${profitPerUnit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {formatPrice(profitPerUnit)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">({profitMargin}%)</span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProductForDiscount(product)}
                            className="gap-1 p-2"
                            title="Manage discounts"
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(product)
                              setShowForm(true)
                            }}
                            className="gap-1 p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="gap-1 p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Discount Modal */}
      {selectedProductForDiscount && (
        <ProductDiscountModal
          productId={selectedProductForDiscount.id}
          productName={selectedProductForDiscount.name}
          onClose={() => setSelectedProductForDiscount(null)}
          onSuccess={() => fetchProducts()}
        />
      )}
    </div>
  )
}
