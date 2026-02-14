"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import WarehouseForm from "./warehouse-form"
import { Plus, Trash2, Edit2, Package } from "lucide-react"

interface Warehouse {
  id: string
  name: string
  location: string
  address: string | null
  city: string | null
  country: string | null
  capacity: number | null
  is_active: boolean
  created_at: string
}

export default function WarehousesContent() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase.from("warehouses").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setWarehouses(data || [])
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return

    try {
      const { error } = await supabase.from("warehouses").delete().eq("id", id)

      if (error) throw error
      setWarehouses(warehouses.filter((w) => w.id !== id))
    } catch (error) {
      console.error("Error deleting warehouse:", error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingWarehouse(null)
  }

  const handleFormSuccess = () => {
    fetchWarehouses()
    handleFormClose()
  }

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      warehouse.name.toLowerCase().includes(searchLower) ||
      warehouse.location.toLowerCase().includes(searchLower) ||
      warehouse.city?.toLowerCase().includes(searchLower) ||
      warehouse.country?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return <div className="p-6">Loading warehouses...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage your warehouse locations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Warehouse
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <WarehouseForm warehouse={editingWarehouse} onSuccess={handleFormSuccess} onCancel={handleFormClose} />
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search by name, location, city, or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.length === 0 ? (
          <Card className="p-8 text-center md:col-span-2 lg:col-span-3">
            <p className="text-muted-foreground">No warehouses found</p>
          </Card>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="p-4 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                  <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingWarehouse(warehouse)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(warehouse.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm flex-1">
                {warehouse.address && (
                  <p>
                    <span className="text-muted-foreground">Address:</span> {warehouse.address}
                  </p>
                )}
                {warehouse.city && (
                  <p>
                    <span className="text-muted-foreground">City:</span> {warehouse.city}
                  </p>
                )}
                {warehouse.country && (
                  <p>
                    <span className="text-muted-foreground">Country:</span> {warehouse.country}
                  </p>
                )}
                {warehouse.capacity && (
                  <p>
                    <span className="text-muted-foreground">Capacity:</span> {warehouse.capacity} units
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded ${warehouse.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {warehouse.is_active ? "Active" : "Inactive"}
                </span>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Package className="w-4 h-4" />
                  View Inventory
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
