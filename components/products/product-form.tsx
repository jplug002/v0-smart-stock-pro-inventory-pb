"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
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
  business_id?: string
}

interface ProductFormProps {
  product: Product | null
  onClose: () => void
  onSuccess: () => void
}

export default function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || "",
    quantity_in_stock: product?.quantity_in_stock || 0,
    reorder_level: product?.reorder_level || 10,
    cost_price: product?.cost_price || 0,
    unit_price: product?.unit_price || 0,
    description: product?.description || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { formatPrice } = useCurrency()

  const profitMargin =
    formData.cost_price > 0
      ? (((formData.unit_price - formData.cost_price) / formData.cost_price) * 100).toFixed(2)
      : formData.unit_price > 0
        ? "100.00"
        : "0.00"

  const profit = formData.unit_price - formData.cost_price

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("quantity") || name.includes("price") || name.includes("reorder")
          ? Number.parseFloat(value) || 0
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error("Product name is required")
      }
      if (!formData.sku.trim()) {
        throw new Error("SKU is required")
      }
      if (formData.unit_price < 0) {
        throw new Error("Selling price cannot be negative")
      }
      if (formData.cost_price < 0) {
        throw new Error("Cost price cannot be negative")
      }
      if (formData.cost_price > formData.unit_price) {
        // Just a warning, not an error - user may have a reason
        console.warn("Cost price is higher than selling price - this will result in a loss")
      }
      if (formData.quantity_in_stock < 0) {
        throw new Error("Quantity in stock cannot be negative")
      }

      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // If creating a new product, check plan limit
      if (!product) {
        // Get user's subscription plan
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", user.id)
          .single()

        const plan = subscription?.plan || "free"

        // Get plan limits
        const { data: limits } = await supabase
          .from("plan_limits")
          .select("max_products")
          .eq("plan", plan)
          .single()

        const maxProducts = limits?.max_products || 50

        // Check current product count
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)

        if ((productCount || 0) >= maxProducts) {
          throw new Error(
            `You've reached the limit of ${maxProducts} products on your ${plan} plan. Upgrade your plan to add more products.`
          )
        }
      }

      const currentBusinessId = localStorage.getItem("currentBusinessId")

      if (product) {
        // Update existing product
        const { error: updateError } = await supabase.from("products").update(formData).eq("id", product.id)

        if (updateError) {
          if (updateError.message.includes("unique")) {
            throw new Error(`A product with SKU "${formData.sku}" already exists`)
          }
          throw new Error(updateError.message || "Failed to update product")
        }
      } else {
        const { error: insertError } = await supabase.from("products").insert([
          {
            ...formData,
            user_id: user.id,
            business_id: currentBusinessId || null, // Link to current business
          },
        ])

        if (insertError) {
          if (insertError.message.includes("unique")) {
            throw new Error(`A product with SKU "${formData.sku}" already exists`)
          }
          throw new Error(insertError.message || "Failed to create product")
        }
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while saving the product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{product ? "Edit Product" : "Add Product"}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{product ? "Edit Product Details" : "Create New Product"}</CardTitle>
            <CardDescription>Fill in the product information below including cost and selling prices</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Laptop"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    placeholder="e.g., SKU-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Electronics"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_in_stock">Quantity in Stock *</Label>
                  <Input
                    id="quantity_in_stock"
                    name="quantity_in_stock"
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={handleChange}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-4">
                <h3 className="font-semibold text-foreground">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price" className="text-foreground">
                      Cost Price (Purchase Price) *
                    </Label>
                    <Input
                      id="cost_price"
                      name="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price || ""}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="border-primary/30"
                    />
                    <p className="text-xs text-muted-foreground">The price you paid to acquire this product</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price" className="text-foreground">
                      Selling Price *
                    </Label>
                    <Input
                      id="unit_price"
                      name="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price || ""}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="border-primary/30"
                    />
                    <p className="text-xs text-muted-foreground">The price you sell this product for</p>
                  </div>
                </div>

                {/* Profit Preview */}
                {(formData.cost_price > 0 || formData.unit_price > 0) && (
                  <div className="mt-4 p-3 bg-card rounded-md border border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Profit per Unit:</span>
                        <p
                          className={`font-bold text-lg ${profit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                        >
                          {formatPrice(profit)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profit Margin:</span>
                        <p
                          className={`font-bold text-lg ${Number.parseFloat(profitMargin) >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                        >
                          {profitMargin}%
                        </p>
                      </div>
                    </div>
                    {profit < 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                        Warning: Selling price is lower than cost price. You will make a loss on this product.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level *</Label>
                <Input
                  id="reorder_level"
                  name="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  required
                  placeholder="10"
                />
                <p className="text-xs text-slate-500">Alert when stock falls below this level</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {success && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Success!</p>
                    <p className="text-sm text-green-700">
                      Product {product ? "updated" : "created"} successfully. Redirecting...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mb-2">{error}</p>
                    <ul className="text-xs text-red-600 space-y-1 ml-4 list-disc">
                      <li>Ensure all required fields are filled in</li>
                      <li>Check that the SKU is unique and not already used</li>
                      <li>Verify numeric values are positive numbers</li>
                      <li>If the error persists, please try again later</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || success}>
                  {loading ? "Saving..." : success ? "Done!" : product ? "Update Product" : "Create Product"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
