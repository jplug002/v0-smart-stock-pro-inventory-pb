"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BatchForm from "./batch-form"
import { Plus, Trash2, Edit2 } from "lucide-react"

interface Batch {
  id: string
  product_id: string
  batch_number: string
  warehouse_id: string
  quantity_received: number
  quantity_available: number
  manufacturing_date: string | null
  expiration_date: string | null
  supplier_id: string | null
  notes: string | null
  created_at: string
}

interface Product {
  id: string
  name: string
  sku: string
}

interface Warehouse {
  id: string
  name: string
}

export default function BatchesContent() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchBatches()
    fetchProducts()
    fetchWarehouses()
  }, [])

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (error) {
      console.error("Error fetching batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("id, name, sku")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase.from("warehouses").select("id, name")

      if (error) throw error
      setWarehouses(data || [])
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return

    try {
      const { error } = await supabase.from("batches").delete().eq("id", id)

      if (error) throw error
      setBatches(batches.filter((b) => b.id !== id))
    } catch (error) {
      console.error("Error deleting batch:", error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingBatch(null)
  }

  const handleFormSuccess = () => {
    fetchBatches()
    handleFormClose()
  }

  const filteredBatches = batches.filter((batch) => {
    const product = products.find((p) => p.id === batch.product_id)
    const warehouse = warehouses.find((w) => w.id === batch.warehouse_id)
    const searchLower = searchTerm.toLowerCase()

    return (
      batch.batch_number.toLowerCase().includes(searchLower) ||
      product?.name.toLowerCase().includes(searchLower) ||
      product?.sku.toLowerCase().includes(searchLower) ||
      warehouse?.name.toLowerCase().includes(searchLower)
    )
  })

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  if (loading) {
    return <div className="p-6">Loading batches...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Batch/Lot Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage product batches and lot numbers</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Batch
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <BatchForm
            batch={editingBatch}
            products={products}
            warehouses={warehouses}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search by batch number, product name, or warehouse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid gap-4">
        {filteredBatches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No batches found</p>
          </Card>
        ) : (
          filteredBatches.map((batch) => {
            const product = products.find((p) => p.id === batch.product_id)
            const warehouse = warehouses.find((w) => w.id === batch.warehouse_id)
            const expired = isExpired(batch.expiration_date)
            const expiringSoon = isExpiringSoon(batch.expiration_date)

            return (
              <Card key={batch.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {product?.name} - {batch.batch_number}
                      </h3>
                      {expired && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Expired</span>}
                      {expiringSoon && !expired && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Expiring Soon</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      SKU: {product?.sku} | Warehouse: {warehouse?.name}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity Received:</span>
                        <p className="font-semibold">{batch.quantity_received}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Available:</span>
                        <p className="font-semibold">{batch.quantity_available}</p>
                      </div>
                      {batch.manufacturing_date && (
                        <div>
                          <span className="text-muted-foreground">Manufactured:</span>
                          <p className="font-semibold">{new Date(batch.manufacturing_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {batch.expiration_date && (
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <p className="font-semibold">{new Date(batch.expiration_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {batch.notes && <p className="text-sm text-muted-foreground mt-2">Notes: {batch.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingBatch(batch)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(batch.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
