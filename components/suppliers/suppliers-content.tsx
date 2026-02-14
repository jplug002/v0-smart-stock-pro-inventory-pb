"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react"
import SupplierForm from "./supplier-form"

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

export default function SuppliersContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
    fetchSuppliers(businessId)

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchSuppliers(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    return () => window.removeEventListener("businessChanged", handleBusinessChange)
  }, [])

  const fetchSuppliers = async (businessId: string | null) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (businessId) {
        query = query.eq("business_id", businessId)
      }

      const { data, error } = await query

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("suppliers").delete().eq("id", id)

      if (error) throw error
      setSuppliers(suppliers.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Error deleting supplier:", error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSupplier(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchSuppliers(currentBusinessId)
  }

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (showForm) {
    return (
      <SupplierForm
        supplier={editingSupplier}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        businessId={currentBusinessId}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
              <p className="text-sm text-muted-foreground">Manage supplier information</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Search Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No suppliers found</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Supplier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">{supplier.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contact_person && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="text-sm font-medium text-foreground">{supplier.contact_person}</p>
                    </div>
                  )}
                  {supplier.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all text-foreground">{supplier.email}</p>
                    </div>
                  )}
                  {supplier.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">{supplier.phone}</p>
                    </div>
                  )}
                  {supplier.address && (
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium text-foreground">
                        {supplier.address}
                        {supplier.city && `, ${supplier.city}`}
                        {supplier.country && `, ${supplier.country}`}
                      </p>
                    </div>
                  )}
                  {supplier.payment_terms && (
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Terms</p>
                      <p className="text-sm font-medium text-foreground">{supplier.payment_terms}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSupplier(supplier)
                        setShowForm(true)
                      }}
                      className="gap-1 flex-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
                      className="gap-1 flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
