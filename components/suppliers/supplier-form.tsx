"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  payment_terms: string | null
  created_at: string
}

interface SupplierFormProps {
  supplier: Supplier | null
  onClose: () => void
  onSuccess: () => void
  businessId?: string | null
}

export default function SupplierForm({ supplier, onClose, onSuccess, businessId }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    contact_person: supplier?.contact_person || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    city: supplier?.city || "",
    country: supplier?.country || "",
    payment_terms: supplier?.payment_terms || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      if (supplier) {
        const { error: updateError } = await supabase.from("suppliers").update(formData).eq("id", supplier.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("suppliers").insert([
          {
            ...formData,
            user_id: user.id,
            business_id: businessId || null,
          },
        ])

        if (insertError) throw insertError
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
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{supplier ? "Edit Supplier" : "Add Supplier"}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              {supplier ? "Edit Supplier Details" : "Create New Supplier"}
            </CardTitle>
            <CardDescription>Fill in the supplier information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Supplier Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., ABC Supplies"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-foreground">
                    Contact Person
                  </Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@supplier.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms" className="text-foreground">
                    Payment Terms
                  </Label>
                  <Input
                    id="payment_terms"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    placeholder="e.g., Net 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground">
                    City
                  </Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="New York" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-foreground">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="USA"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
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
