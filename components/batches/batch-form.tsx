"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

interface BatchFormProps {
  batch?: any
  products: any[]
  warehouses: any[]
  onSuccess: () => void
  onCancel: () => void
}

export default function BatchForm({ batch, products, warehouses, onSuccess, onCancel }: BatchFormProps) {
  const [formData, setFormData] = useState({
    product_id: batch?.product_id || "",
    batch_number: batch?.batch_number || "",
    warehouse_id: batch?.warehouse_id || "",
    quantity_received: batch?.quantity_received || "",
    quantity_available: batch?.quantity_available || "",
    manufacturing_date: batch?.manufacturing_date || "",
    expiration_date: batch?.expiration_date || "",
    notes: batch?.notes || "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.product_id || !formData.batch_number || !formData.warehouse_id) {
        throw new Error("Please fill in all required fields")
      }

      const submitData = {
        product_id: formData.product_id,
        batch_number: formData.batch_number,
        warehouse_id: formData.warehouse_id,
        quantity_received: Number.parseInt(formData.quantity_received),
        quantity_available: Number.parseInt(formData.quantity_available),
        manufacturing_date: formData.manufacturing_date || null,
        expiration_date: formData.expiration_date || null,
        notes: formData.notes || null,
      }

      if (batch?.id) {
        const { error: updateError } = await supabase.from("batches").update(submitData).eq("id", batch.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("batches").insert([submitData])

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">{batch ? "Edit Batch" : "Add New Batch"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product *</label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Batch Number *</label>
          <Input
            type="text"
            name="batch_number"
            value={formData.batch_number}
            onChange={handleChange}
            placeholder="e.g., BATCH-001"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Warehouse *</label>
          <select
            name="warehouse_id"
            value={formData.warehouse_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">Select a warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity Received *</label>
          <Input
            type="number"
            name="quantity_received"
            value={formData.quantity_received}
            onChange={handleChange}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity Available *</label>
          <Input
            type="number"
            name="quantity_available"
            value={formData.quantity_available}
            onChange={handleChange}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Manufacturing Date</label>
          <Input type="date" name="manufacturing_date" value={formData.manufacturing_date} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expiration Date</label>
          <Input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes about this batch..."
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : batch ? "Update Batch" : "Create Batch"}
        </Button>
      </div>
    </form>
  )
}
