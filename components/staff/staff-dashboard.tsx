"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, Users, History } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Staff {
  id: string
  name: string
  salary: number | null
  hire_date: string
}

interface SalaryHistory {
  id: string
  staff_name: string
  previous_salary: number
  new_salary: number
  increase_amount: number
  increase_percentage: number
  effective_date: string
  reason: string
}

interface SalaryMetrics {
  totalMonthly: number
  totalYearly: number
  staffCount: number
  monthlyData: { month: string; total: number }[]
}

interface StaffDashboardProps {
  businessId?: string | null
}

export default function StaffDashboard({ businessId }: StaffDashboardProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [metrics, setMetrics] = useState<SalaryMetrics>({
    totalMonthly: 0,
    totalYearly: 0,
    staffCount: 0,
    monthlyData: [],
  })
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaffAndCalculateMetrics()
  }, [businessId])

  const fetchStaffAndCalculateMetrics = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let staffQuery = supabase.from("staff").select("*").eq("user_id", user.id).eq("is_active", true)

      if (businessId) {
        staffQuery = staffQuery.eq("business_id", businessId)
      }

      const { data: staffData, error } = await staffQuery

      if (error) throw error

      setStaff(staffData || [])

      const staffWithSalary = (staffData || []).filter((s) => s.salary)
      const totalMonthly = staffWithSalary.reduce((sum, s) => sum + (s.salary || 0), 0)
      const totalYearly = totalMonthly * 12

      const monthlyData = []
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        monthlyData.push({
          month,
          total: totalMonthly,
        })
      }

      setMetrics({
        totalMonthly,
        totalYearly,
        staffCount: staffWithSalary.length,
        monthlyData,
      })

      const { data: historyData } = await supabase
        .from("salary_history")
        .select("*")
        .eq("user_id", user.id)
        .order("effective_date", { ascending: false })
        .limit(50)

      if (historyData) {
        // Filter history to only include staff from current business
        const staffIds = new Set((staffData || []).map((s: Staff) => s.id))
        const filteredHistory = historyData.filter((record: any) => staffIds.has(record.staff_id))

        const historyWithNames = filteredHistory.map((record: any) => {
          const staffMember = staffData?.find((s: Staff) => s.id === record.staff_id)
          return {
            ...record,
            staff_name: staffMember?.name || "Unknown",
          }
        })
        setSalaryHistory(historyWithNames)
      }
    } catch (err) {
      console.error("Failed to fetch staff metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Monthly Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₵{metrics.totalMonthly.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">All active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Salary Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₵{metrics.totalYearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Projected annual payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.staffCount}</div>
            <p className="text-xs text-muted-foreground">With salary assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Salary History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Monthly Salary Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Monthly Salary Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value) => `₵${Number(value).toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Monthly Salary"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Staff List with Individual Salaries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Staff Salary Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active staff members with salary assigned</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Hired:{" "}
                          {new Date(member.hire_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          ₵{(member.salary || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">Monthly</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <History className="w-5 h-5" />
                Salary History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salaryHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No salary changes recorded</p>
              ) : (
                <div className="space-y-3">
                  {salaryHistory.map((record) => (
                    <div key={record.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">{record.staff_name}</p>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                          +{record.increase_percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground">Previous</p>
                          <p className="font-bold text-foreground">
                            ₵{record.previous_salary.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">New Salary</p>
                          <p className="font-bold text-green-600">
                            ₵{record.new_salary.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Increase: +₵{record.increase_amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} |
                        Effective: {record.effective_date}
                      </div>
                      {record.reason && <p className="text-xs text-muted-foreground mt-2">Reason: {record.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
