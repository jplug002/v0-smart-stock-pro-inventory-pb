'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDashboard({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Fetch staff member
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (staffError || !staff) redirect('/staff')

  // Calculate monthly and yearly earnings based on hire date
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const baseSalary = staff.salary || 0

  // Monthly and yearly calculations (based on base salary)
  const monthlyEarnings = baseSalary
  const yearsOfService = staff.hire_date 
    ? Math.floor((new Date().getTime() - new Date(staff.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0
  const yearlyEarnings = baseSalary * 12

  // Generate monthly breakdown
  const monthlyData = []
  for (let month = 1; month <= 12; month++) {
    monthlyData.push({
      month: new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' }),
      earnings: baseSalary
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/staff">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{staff.name}</h1>
            <p className="text-sm text-slate-600 capitalize">{staff.role} • {staff.department || 'No Department'}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monthly Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">₵{monthlyEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Yearly Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">₵{yearlyEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Years of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="font-medium text-slate-900">{staff.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Phone</p>
              <p className="font-medium text-slate-900">{staff.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Hire Date</p>
              <p className="font-medium text-slate-900">
                {staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-medium text-slate-900">{staff.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings Schedule ({currentYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium text-slate-900">Month</th>
                    <th className="text-right py-2 px-4 font-medium text-slate-900">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900">{data.month}</td>
                      <td className="text-right py-3 px-4 font-medium text-slate-900">
                        ₵{data.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
