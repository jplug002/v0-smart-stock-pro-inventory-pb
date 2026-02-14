"use client"

import type React from "react"
import StaffDashboard from "./staff-dashboard"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Edit2, Trash2, Users, Eye, DollarSign } from "lucide-react"
import Link from "next/link"
import SalaryIncreaseModal from "./salary-increase-modal"

interface Staff {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  department: string | null
  is_active: boolean
  hire_date: string
  salary: number | null
  user_id: string | null
}

export default function StaffContent() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"dashboard" | "staff">("dashboard")
  const [salaryModal, setSalaryModal] = useState<{
    open: boolean
    staffId?: string
    staffName?: string
    salary?: number
  }>({ open: false })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
    department: "",
    salary: "",
  })
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
    fetchCurrentUser()
    fetchStaff(businessId)

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchStaff(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    return () => window.removeEventListener("businessChanged", handleBusinessChange)
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    } catch (err) {
      console.error("Failed to get current user:", err)
    }
  }

  const fetchStaff = async (businessId: string | null) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase.from("staff").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

      if (businessId) {
        query = query.eq("business_id", businessId)
      }

      const { data, error } = await query

      if (error) throw error
      setStaff(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch staff")
      console.error("Fetch staff error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      setError("Name and email are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const staffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        department: formData.department || null,
        salary: formData.salary ? Number.parseFloat(formData.salary) : null,
        user_id: currentUserId,
        business_id: currentBusinessId || null,
      }

      if (editingId) {
        const { error } = await supabase.from("staff").update(staffData).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("staff").insert([staffData])
        if (error) throw error
      }

      setFormData({ name: "", email: "", phone: "", role: "staff", department: "", salary: "" })
      setShowForm(false)
      setEditingId(null)
      await fetchStaff(currentBusinessId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred"
      setError(errorMsg)
      console.error("Submit error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || "",
      role: staffMember.role,
      department: staffMember.department || "",
      salary: staffMember.salary ? staffMember.salary.toString() : "",
    })
    setEditingId(staffMember.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("staff").delete().eq("id", id)
        if (error) throw error
        await fetchStaff(currentBusinessId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete staff member")
        console.error("Delete error:", err)
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: "", email: "", phone: "", role: "staff", department: "", salary: "" })
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span className="truncate">Staff</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your team members and permissions</p>
              </div>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto justify-center">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Staff Member</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "dashboard"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "staff"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff List
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" ? (
          <StaffDashboard businessId={currentBusinessId} />
        ) : (
          <>
            {/* Form */}
            {showForm && (
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    {editingId ? "Edit Staff Member" : "Add New Staff Member"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-foreground">
                          Role *
                        </Label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-foreground">
                          Department
                        </Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="e.g., Sales, Warehouse"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary" className="text-foreground">
                          Monthly Salary
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          step="0.01"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                    <div className="flex gap-3">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Staff Member"}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Staff List */}
            {loading && !showForm ? (
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading staff...</p>
                </div>
              </div>
            ) : staff.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No staff members yet. Add one to get started.</p>
                  <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Staff Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {staff.map((member) => (
                  <Card key={member.id} className={!member.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto">
                          <div className="text-left">
                            <p className="font-medium text-foreground capitalize">{member.role}</p>
                            {member.department && <p className="text-muted-foreground text-xs">{member.department}</p>}
                            {member.salary && <p className="text-primary font-medium">₵{member.salary.toFixed(2)}</p>}
                          </div>
                          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto flex-wrap justify-start sm:justify-end">
                            <Link href={`/staff/employee-dashboard/${member.id}`} className="flex-shrink-0">
                              <Button variant="ghost" size="sm" className="gap-1 h-8 px-2 text-xs">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSalaryModal({
                                  open: true,
                                  staffId: member.id,
                                  staffName: member.name,
                                  salary: member.salary || 0,
                                })
                              }
                              className="gap-1 text-green-600 hover:text-green-700 h-8 px-2 text-xs flex-shrink-0"
                            >
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Salary</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(member)}
                              className="gap-1 h-8 px-2 text-xs flex-shrink-0"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(member.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 h-8 px-2 text-xs flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        {/* Salary Increase Modal Overlay */}
        {salaryModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <SalaryIncreaseModal
                staffId={salaryModal.staffId || ""}
                staffName={salaryModal.staffName || ""}
                currentSalary={salaryModal.salary || 0}
                onClose={() => setSalaryModal({ open: false })}
                onSuccess={() => {
                  setSalaryModal({ open: false })
                  fetchStaff(currentBusinessId)
                }}
              />
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
