"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  Search, 
  CreditCard, 
  RefreshCw, 
  Download, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from "lucide-react"

// Type for Paystack transaction
interface PaystackTransaction {
  id: string
  user_id: string
  reference: string
  amount: number
  currency: string
  plan: string
  billing_cycle: string
  status: string
  created_at: string
  updated_at: string
}

export default function PaymentsManagement() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<PaystackTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredTransactions, setFilteredTransactions] = useState<PaystackTransaction[]>([])

  // Fetch transactions from database
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("paystack_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) throw error
      setTransactions(data || [])
      setFilteredTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTransactions()

    // Set up real-time subscription for transactions
    const channel = supabase
      .channel("payments_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "paystack_transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new as PaystackTransaction, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as PaystackTransaction) : t))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTransactions, supabase])

  // Filter transactions based on search and status
  useEffect(() => {
    let filtered = transactions

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchQuery, statusFilter])

  // Calculate stats
  const stats = {
    total: transactions.length,
    successful: transactions.filter((t) => t.status === "success").length,
    pending: transactions.filter((t) => t.status === "pending").length,
    failed: transactions.filter((t) => t.status === "failed" || t.status === "abandoned").length,
    totalRevenue: transactions
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    todayRevenue: transactions
      .filter((t) => {
        const today = new Date().toDateString()
        return t.status === "success" && new Date(t.created_at).toDateString() === today
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0),
  }

  // Format currency (amount is in kobo)
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
      case "abandoned":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {status === "abandoned" ? "Abandoned" : "Failed"}
          </Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // Get plan badge
  const getPlanBadge = (plan: string) => {
    const badges: Record<string, string> = {
      enterprise: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
      pro_plus: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
      pro: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    }
    return (
      <Badge className={badges[plan] || "bg-gray-100 text-gray-800"}>
        {plan.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">View and manage Paystack transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatNaira(stats.totalRevenue)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatNaira(stats.todayRevenue)}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-500/10">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Successful</p>
                  <p className="text-xl font-bold text-green-600">{stats.successful}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed/Abandoned</p>
                  <p className="text-xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="successful">Successful</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            {/* Filters */}
            <Card className="bg-card border-border mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by reference or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
                <CardDescription>All Paystack payment transactions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Reference</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">User ID</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Plan</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Billing</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Amount</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Status</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-foreground font-mono">
                              {transaction.reference.substring(0, 20)}...
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                              {transaction.user_id?.substring(0, 8)}...
                            </td>
                            <td className="py-3 px-4">{getPlanBadge(transaction.plan)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                              {transaction.billing_cycle}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-foreground">
                              {formatNaira(transaction.amount)}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="successful">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Successful Transactions</CardTitle>
                <CardDescription>All completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Reference</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Plan</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Amount</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((t) => t.status === "success")
                        .map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-foreground font-mono">
                              {transaction.reference.substring(0, 20)}...
                            </td>
                            <td className="py-3 px-4">{getPlanBadge(transaction.plan)}</td>
                            <td className="py-3 px-4 text-sm font-medium text-green-600">
                              {formatNaira(transaction.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <CardDescription>Transactions awaiting completion</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.filter((t) => t.status === "pending").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending transactions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Reference</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Plan</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Amount</th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions
                          .filter((t) => t.status === "pending")
                          .map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm text-foreground font-mono">
                                {transaction.reference.substring(0, 20)}...
                              </td>
                              <td className="py-3 px-4">{getPlanBadge(transaction.plan)}</td>
                              <td className="py-3 px-4 text-sm font-medium text-yellow-600">
                                {formatNaira(transaction.amount)}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
