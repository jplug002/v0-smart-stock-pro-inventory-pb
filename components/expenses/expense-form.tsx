"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
}

interface ExpenseFormProps {
  onClose: () => void
  onSuccess: () => void
  businessId?: string | null
}

export default function ExpenseForm({ onClose, onSuccess, businessId }: ExpenseFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    product_id: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingData, setFetchingData] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const currentBusinessId = businessId || localStorage.getItem("currentBusinessId")

      let suppliersQuery = supabase.from("suppliers").select("id, name").eq("user_id", user.id)
      if (currentBusinessId) {
        suppliersQuery = suppliersQuery.eq("business_id", currentBusinessId)
      }
      const { data: suppliersData, error: suppliersError } = await suppliersQuery

      if (suppliersError) throw suppliersError
      setSuppliers(suppliersData || [])

      let productsQuery = supabase.from("products").select("id, name").eq("user_id", user.id)
      if (currentBusinessId) {
        productsQuery = productsQuery.eq("business_id", currentBusinessId)
      }
      const { data: productsData, error: productsError } = await productsQuery

      if (productsError) throw productsError
      setProducts(productsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setFetchingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) : value,
    }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      category: value,
      product_id: value === "Product Purchase" || value === "Product Restocking" ? prev.product_id : "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.category || !formData.description || !formData.amount) {
        throw new Error("Please fill in all required fields")
      }

      const isProductExpense = formData.category === "Product Purchase" || formData.category === "Product Restocking"
      if (isProductExpense && !formData.product_id) {
        throw new Error("Please select a product for this expense type")
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const currentBusinessId = businessId || localStorage.getItem("currentBusinessId")

      const { error: insertError } = await supabase.from("expenses").insert([
        {
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          expense_date: formData.expense_date,
          supplier_id: formData.supplier_id || null,
          product_id: formData.product_id || null,
          user_id: user.id,
          business_id: currentBusinessId || null,
        },
      ])

      if (insertError) throw insertError

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const isProductCategory = formData.category === "Product Purchase" || formData.category === "Product Restocking"

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Add Expense</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Record New Expense</CardTitle>
            <CardDescription>Add a new business expense</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">
                      Category *
                    </Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleCategoryChange}
                      required
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select category</option>
                      <optgroup label="Product Expenses">
                        <option value="Product Purchase">Product Purchase</option>
                        <option value="Product Restocking">Product Restocking</option>
                      </optgroup>
                      <optgroup label="Operating Expenses">
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Other">Other</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {isProductCategory && (
                  <div className="space-y-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <Label htmlFor="product_id" className="text-primary">
                      Select Product *
                    </Label>
                    <select
                      id="product_id"
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-primary/30 bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-primary/80">
                      This expense will be linked to the selected product for cost tracking
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description *
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Purchased 100 units of inventory"
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expense_date" className="text-foreground">
                      Date *
                    </Label>
                    <Input
                      id="expense_date"
                      name="expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier_id" className="text-foreground">
                      Supplier (optional)
                    </Label>
                    <select
                      id="supplier_id"
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.amount > 0 && (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Expense Amount</p>
                    <p className="text-2xl font-bold text-foreground">{formatPrice(formData.amount)}</p>
                    {isProductCategory && formData.product_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Linked to: {products.find((p) => p.id === formData.product_id)?.name}
                      </p>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Recording..." : "Record Expense"}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
