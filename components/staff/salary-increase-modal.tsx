// Salary increase management with history tracking
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, History } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'

interface SalaryIncreaseModalProps {
  staffId: string
  staffName: string
  currentSalary: number
  onClose: () => void
  onSuccess: () => void
}

interface SalaryHistoryRecord {
  id: string
  previous_salary: number
  new_salary: number
  increase_amount: number
  increase_percentage: number
  effective_date: string
  reason: string
}

export default function SalaryIncreaseModal({ staffId, staffName, currentSalary, onClose, onSuccess }: SalaryIncreaseModalProps) {
  const [showForm, setShowForm] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SalaryHistoryRecord[]>([])
  const { formatPrice } = useCurrency()

  const [formData, setFormData] = useState({
    new_salary: currentSalary.toString(),
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
  })

  const calculateIncrease = () => {
    const newSalary = parseFloat(formData.new_salary) || currentSalary
    const increaseAmount = newSalary - currentSalary
    const increasePercentage = currentSalary > 0 ? (increaseAmount / currentSalary) * 100 : 0
    return { increaseAmount, increasePercentage }
  }

  const fetchHistory = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('salary_history')
        .select('*')
        .eq('staff_id', staffId)
        .order('effective_date', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('[v0] Fetch history error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newSalary = parseFloat(formData.new_salary)

    if (!newSalary || newSalary <= 0) {
      setError('Please enter a valid salary amount')
      return
    }

    if (newSalary === currentSalary) {
      setError('New salary must be different from current salary')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('User not authenticated')

      const { increaseAmount, increasePercentage } = calculateIncrease()

      // Insert salary history record
      const { error: insertError } = await supabase.from('salary_history').insert([
        {
          staff_id: staffId,
          user_id: user.id,
          previous_salary: currentSalary,
          new_salary: newSalary,
          increase_amount: increaseAmount,
          increase_percentage: increasePercentage,
          effective_date: formData.effective_date,
          reason: formData.reason || null,
        },
      ])

      if (insertError) throw insertError

      // Update staff salary
      const { error: updateError } = await supabase.from('staff').update({ salary: newSalary }).eq('id', staffId)

      if (updateError) throw updateError

      setFormData({
        new_salary: newSalary.toString(),
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
      })
      setShowForm(false)
      onSuccess()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update salary'
      setError(errorMsg)
      console.error('[v0] Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const { increaseAmount, increasePercentage } = calculateIncrease()

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={showForm ? 'default' : 'outline'}
          onClick={() => setShowForm(true)}
          className="flex-1 gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Increase Salary
        </Button>
        <Button
          variant={showHistory ? 'default' : 'outline'}
          onClick={() => {
            setShowHistory(true)
            fetchHistory()
          }}
          className="flex-1 gap-2"
        >
          <History className="w-4 h-4" />
          History
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{staffName}</CardTitle>
            <p className="text-sm text-slate-600 mt-1">Current Salary: {formatPrice(currentSalary)}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>New Salary *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.new_salary}
                  onChange={(e) => setFormData({ ...formData, new_salary: e.target.value })}
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-slate-600 mt-2">
                  Increase: {formatPrice(Math.max(0, increaseAmount))} ({increasePercentage > 0 ? '+' : ''}{increasePercentage.toFixed(2)}%)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Performance review, Promotion, Annual increase"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Salary'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-600">
                <p>No salary history available</p>
              </CardContent>
            </Card>
          ) : (
            history.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatPrice(record.previous_salary)} → {formatPrice(record.new_salary)}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        +{formatPrice(record.increase_amount)} (+{record.increase_percentage.toFixed(2)}%)
                      </p>
                      {record.reason && <p className="text-sm text-slate-600">{record.reason}</p>}
                      <p className="text-xs text-slate-500 mt-1">Effective: {record.effective_date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
