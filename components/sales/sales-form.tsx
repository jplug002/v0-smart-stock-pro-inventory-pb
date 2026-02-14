"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, ShoppingCart, Percent } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

// ... existing interfaces ...

interface Product {
  id: string
  name: string
  unit_price: number
  quantity_in_stock: number
}

interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount_percent: number
  total: number
}

interface SalesFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function SalesForm({ onClose, onSuccess }: SalesFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Get current business ID for filtering
      const currentBusinessId = localStorage.getItem("currentBusinessId")

      let query = supabase.from("products").select("id, name, unit_price, quantity_in_stock").eq("user_id", user.id)

      // Filter by business if one is selected
      if (currentBusinessId) {
        query = query.eq("business_id", currentBusinessId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products")
    } finally {
      setFetchingProducts(false)
    }
  }

  // ... existing cart management code ...
  const handleAddToCart = () => {
    if (!selectedProduct) {
      setError("Please select a product")
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) {
      setError("Product not found")
      return
    }

    const existingCartItem = cart.find((item) => item.product_id === selectedProduct)
    const totalQuantityInCart = existingCartItem ? existingCartItem.quantity + quantity : quantity

    if (totalQuantityInCart > product.quantity_in_stock) {
      setError(
        `Insufficient stock. Available: ${product.quantity_in_stock}, In cart: ${existingCartItem?.quantity || 0}`,
      )
      return
    }

    // Calculate discount based on type
    let discountedUnitPrice: number
    let appliedDiscountPercent: number

    if (discountType === "percent") {
      discountedUnitPrice = product.unit_price * (1 - discountPercent / 100)
      appliedDiscountPercent = discountPercent
    } else {
      // Convert amount discount to percent for storage
      const discountPerUnit = Math.min(discountAmount / quantity, product.unit_price)
      discountedUnitPrice = product.unit_price - discountPerUnit
      appliedDiscountPercent = (discountPerUnit / product.unit_price) * 100
    }

    const itemTotal = quantity * discountedUnitPrice

    if (existingCartItem) {
      setCart(
        cart.map((item) =>
          item.product_id === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + quantity,
                discount_percent: appliedDiscountPercent,
                total: (item.quantity + quantity) * discountedUnitPrice,
              }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: product.unit_price,
          discount_percent: appliedDiscountPercent,
          total: itemTotal,
        },
      ])
    }

    setSelectedProduct("")
    setQuantity(1)
    setDiscountPercent(0)
    setDiscountAmount(0)
    setError(null)
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity > product.quantity_in_stock) {
      setError(`Max available: ${product.quantity_in_stock}`)
      return
    }

    if (newQuantity < 1) {
      handleRemoveFromCart(productId)
      return
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unit_price * (1 - item.discount_percent / 100),
            }
          : item,
      ),
    )
    setError(null)
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const cartDiscount = cart.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price * item.discount_percent) / 100,
    0,
  )
  const cartTotal = cartSubtotal - cartDiscount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      setError("Please add at least one product to the cart")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Get current business ID for data isolation
      const currentBusinessId = localStorage.getItem("currentBusinessId")

      // Insert all sales records with business_id
      for (const item of cart) {
        const product = products.find((p) => p.id === item.product_id)
        if (!product) continue

        const discountedUnitPrice = item.unit_price * (1 - item.discount_percent / 100)
        const totalAmount = item.quantity * discountedUnitPrice

        // Insert sale record with business_id
        const { error: saleError } = await supabase.from("sales").insert([
          {
            user_id: user.id,
            business_id: currentBusinessId || null, // Link to current business
            product_id: item.product_id,
            quantity_sold: item.quantity,
            unit_price: discountedUnitPrice,
            total_amount: totalAmount,
            notes: notes || null,
            sale_date: new Date().toISOString(),
          },
        ])

        if (saleError) throw saleError

        // Update product stock
        const { error: updateError } = await supabase
          .from("products")
          .update({
            quantity_in_stock: product.quantity_in_stock - item.quantity,
          })
          .eq("id", item.product_id)

        if (updateError) throw updateError
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Record Sale</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {fetchingProducts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Product Selection Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Add Products</CardTitle>
                <CardDescription>Select products to add to sale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <select
                    id="product"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id} disabled={product.quantity_in_stock === 0}>
                        {product.name} - {formatPrice(product.unit_price)} (Stock: {product.quantity_in_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Discount Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={discountType === "percent" ? "default" : "outline"}
                        onClick={() => setDiscountType("percent")}
                        className="h-8 text-xs"
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        Percentage
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={discountType === "amount" ? "default" : "outline"}
                        onClick={() => setDiscountType("amount")}
                        className="h-8 text-xs"
                      >
                        Amount
                      </Button>
                    </div>
                  </div>

                  {discountType === "percent" ? (
                    <div className="space-y-2">
                      <Label htmlFor="discount-percent" className="flex items-center gap-1 text-sm">
                        <Percent className="w-3 h-3" />
                        Discount Percentage
                      </Label>
                      <Input
                        id="discount-percent"
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number.parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">Enter discount as percentage (0-100%)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="discount-amount" className="text-sm">
                        Discount Amount
                      </Label>
                      <Input
                        id="discount-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">Enter exact discount amount in currency</p>
                    </div>
                  )}
                </div>

                <Button type="button" onClick={handleAddToCart} disabled={!selectedProduct} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add to Sale
                </Button>
              </CardContent>
            </Card>

            {/* Cart Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No products added yet</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.unit_price)} x {item.quantity}
                            {item.discount_percent > 0 && (
                              <span className="text-success ml-1">(-{item.discount_percent.toFixed(1)}%)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 bg-transparent"
                              onClick={() => handleUpdateCartQuantity(item.product_id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm text-foreground">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 bg-transparent"
                              onClick={() => handleUpdateCartQuantity(item.product_id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <span className="font-medium text-sm w-20 text-right text-foreground">
                            {formatPrice(item.total)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatPrice(cartSubtotal)}</span>
                      </div>
                      {cartDiscount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Discount</span>
                          <span>-{formatPrice(cartDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">{formatPrice(cartTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes about this sale..."
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    rows={2}
                  />
                </div>

                {error && <p className="text-sm text-destructive font-medium mt-3">{error}</p>}

                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || cart.length === 0}
                    className="flex-1"
                  >
                    {loading ? "Processing..." : `Complete Sale (${formatPrice(cartTotal)})`}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
