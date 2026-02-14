"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import ExpenseForm from "./expense-form"
import { useCurrency } from "@/hooks/use-currency"

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  supplier_id: string | null
  created_at: string
  supplier_name?: string
}

export default function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const { formatPrice } = useCurrency()
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
    fetchExpenses(businessId)

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchExpenses(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    return () => window.removeEventListener("businessChanged", handleBusinessChange)
  }, [])

  const fetchExpenses = async (businessId: string | null) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let expensesQuery = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false })

      if (businessId) {
        expensesQuery = expensesQuery.eq("business_id", businessId)
      }

      const { data: expensesData, error: expensesError } = await expensesQuery

      if (expensesError) throw expensesError

      let suppliersQuery = supabase.from("suppliers").select("id, name").eq("user_id", user.id)
      if (businessId) {
        suppliersQuery = suppliersQuery.eq("business_id", businessId)
      }
      const { data: suppliersData } = await suppliersQuery

      const supplierMap = new Map(suppliersData?.map((s) => [s.id, s.name]) || [])

      const enrichedExpenses = (expensesData || []).map((expense) => ({
        ...expense,
        supplier_name: expense.supplier_id ? supplierMap.get(expense.supplier_id) : null,
      }))

      setExpenses(enrichedExpenses)
      setTotalExpenses(enrichedExpenses.reduce((sum, e) => sum + e.amount, 0))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error
      setExpenses(expenses.filter((e) => e.id !== id))
      setTotalExpenses(expenses.filter((e) => e.id !== id).reduce((sum, e) => sum + e.amount, 0))
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchExpenses(currentBusinessId)
  }

  if (showForm) {
    return <ExpenseForm onClose={handleFormClose} onSuccess={handleFormSuccess} businessId={currentBusinessId} />
  }

  // Group expenses by category
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = []
      }
      acc[expense.category].push(expense)
      return acc
    },
    {} as Record<string, Expense[]>,
  )

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
              <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
              <p className="text-sm text-muted-foreground">Track business expenses</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatPrice(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">All recorded expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expense Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{expenses.length}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Expenses by Category */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading expenses...</p>
            </div>
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No expenses recorded yet</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    {category}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({formatPrice(categoryExpenses.reduce((sum, e) => sum + e.amount, 0))})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left font-semibold text-foreground">Description</th>
                          <th className="px-4 py-2 text-left font-semibold text-foreground">Supplier</th>
                          <th className="px-4 py-2 text-left font-semibold text-foreground">Amount</th>
                          <th className="px-4 py-2 text-left font-semibold text-foreground">Date</th>
                          <th className="px-4 py-2 text-left font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryExpenses.map((expense) => (
                          <tr key={expense.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="px-4 py-3 text-foreground">{expense.description}</td>
                            <td className="px-4 py-3 text-muted-foreground">{expense.supplier_name || "-"}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{formatPrice(expense.amount)}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(expense.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
