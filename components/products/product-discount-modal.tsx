"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from 'lucide-react'

interface ProductDiscount {
  id: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  is_active: boolean
  start_date: string
  end_date: string
  description: string
}

interface ProductDiscountModalProps {
  productId: string
  productName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ProductDiscountModal({
  productId,
  productName,
  onClose,
  onSuccess,
}: ProductDiscountModalProps) {
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDiscounts()
  }, [productId])

  const fetchDiscounts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("product_discounts")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDiscounts(data || [])
    } catch (error) {
      console.error("[v0] Error fetching discounts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("product_discounts").insert({
        product_id: productId,
        user_id: user.id,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description,
        is_active: true,
      })

      if (error) throw error

      setFormData({
        discount_type: "percentage",
        discount_value: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        description: "",
      })
      setShowForm(false)
      fetchDiscounts()
      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error adding discount:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("product_discounts").delete().eq("id", discountId)

      if (error) throw error
      fetchDiscounts()
    } catch (error) {
      console.error("[v0] Error deleting discount:", error)
    }
  }

  const handleToggleDiscount = async (discountId: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("product_discounts")
        .update({ is_active: !isActive })
        .eq("id", discountId)

      if (error) throw error
      fetchDiscounts()
    } catch (error) {
      console.error("[v0] Error updating discount:", error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Discounts: {productName}</DialogTitle>
          <DialogDescription>Add, edit, or remove discounts for this product</DialogDescription>
        </DialogHeader>

        {/* Current Discounts List */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Active Discounts</h3>
            {loading ? (
              <p className="text-sm text-slate-600">Loading discounts...</p>
            ) : discounts.length === 0 ? (
              <p className="text-sm text-slate-600">No discounts set for this product</p>
            ) : (
              <div className="space-y-2">
                {discounts.map((discount) => (
                  <Card key={discount.id} className={!discount.is_active ? "opacity-50" : ""}>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {discount.discount_type === "percentage"
                            ? `${discount.discount_value}% OFF`
                            : `₵${discount.discount_value.toFixed(2)} OFF`}
                        </p>
                        {discount.description && (
                          <p className="text-sm text-slate-600">{discount.description}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {new Date(discount.start_date).toLocaleDateString()} -{" "}
                          {new Date(discount.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleDiscount(discount.id, discount.is_active)}
                        >
                          {discount.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Discount Form */}
          {showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDiscount} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="discount-type">Discount Type</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            discount_type: value as "percentage" | "fixed",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="discount-value">Discount Value</Label>
                      <Input
                        id="discount-value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_value: parseFloat(e.target.value) })
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({ ...formData, start_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., Summer Sale"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Discount"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowForm(true)} className="w-full">
              Add New Discount
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
