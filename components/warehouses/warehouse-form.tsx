"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

interface WarehouseFormProps {
  warehouse?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function WarehouseForm({ warehouse, onSuccess, onCancel }: WarehouseFormProps) {
  const [formData, setFormData] = useState({
    name: warehouse?.name || "",
    location: warehouse?.location || "",
    address: warehouse?.address || "",
    city: warehouse?.city || "",
    country: warehouse?.country || "",
    capacity: warehouse?.capacity || "",
    is_active: warehouse?.is_active ?? true,
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.name || !formData.location) {
        throw new Error("Please fill in all required fields")
      }

      const submitData = {
        name: formData.name,
        location: formData.location,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
        is_active: formData.is_active,
      }

      if (warehouse?.id) {
        const { error: updateError } = await supabase.from("warehouses").update(submitData).eq("id", warehouse.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("warehouses").insert([submitData])

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
      <h2 className="text-xl font-semibold">{warehouse ? "Edit Warehouse" : "Add New Warehouse"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Main Warehouse"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location *</label>
          <Input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Building A"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <Input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <Input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Capacity (units)</label>
          <Input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="0" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <label className="text-sm font-medium">Active</label>
        </div>
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
          {loading ? "Saving..." : warehouse ? "Update Warehouse" : "Create Warehouse"}
        </Button>
      </div>
    </form>
  )
}
