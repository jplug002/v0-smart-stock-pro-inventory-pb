// Product discount management component with modal form and discount list
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Tag } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'

interface ProductDiscount {
  id: string
  product_id: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  is_active: boolean
  start_date: string
  end_date: string | null
  description: string | null
  customer_id: string | null
}

interface ProductDiscountsProps {
  productId: string
  productName: string
  productPrice: number
  onClose: () => void
}

export default function ProductDiscounts({ productId, productName, productPrice, onClose }: ProductDiscountsProps) {
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { formatPrice } = useCurrency()

  const [formData, setFormData] = useState({
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    customer_id: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
  })

  useEffect(() => {
    fetchDiscounts()
  }, [productId])

  const fetchDiscounts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('product_discounts')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiscounts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch discounts')
      console.error('[v0] Fetch discounts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.discount_value) {
      setError('Discount value is required')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const discountData = {
        product_id: productId,
        user_id: user.id,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        customer_id: formData.customer_id || null,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
      }

      if (editingId) {
        const { error } = await supabase
          .from('product_discounts')
          .update(discountData)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('product_discounts').insert([discountData])
        if (error) throw error
      }

      setFormData({
        discount_type: 'percentage',
        discount_value: '',
        customer_id: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
      })
      setShowForm(false)
      setEditingId(null)
      await fetchDiscounts()
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save discount'
      setError(errorMsg)
      console.error('[v0] Submit error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('product_discounts').delete().eq('id', id)
      if (error) throw error
      await fetchDiscounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete discount')
      console.error('[v0] Delete error:', err)
    }
  }

  const calculateDiscountedPrice = (discount: ProductDiscount) => {
    if (discount.discount_type === 'percentage') {
      return productPrice * (1 - discount.discount_value / 100)
    } else {
      return Math.max(0, productPrice - discount.discount_value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{productName}</h3>
          <p className="text-sm text-slate-600">Original Price: {formatPrice(productPrice)}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Discount
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Discount' : 'Create New Discount'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Customer ID (Optional - leave blank for all customers)</Label>
                  <Input
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    placeholder="Customer email or ID"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Bulk order discount, Loyalty discount"
                  />
                </div>
              </div>

              {/* Price Preview */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <p className="text-sm text-slate-600">
                  Discounted Price:{' '}
                  <span className="font-semibold text-slate-900">
                    {formatPrice(
                      formData.discount_value
                        ? calculateDiscountedPrice({
                            discount_type: formData.discount_type,
                            discount_value: parseFloat(formData.discount_value) || 0,
                          } as any)
                        : productPrice
                    )}
                  </span>
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit">Save Discount</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      discount_type: 'percentage',
                      discount_value: '',
                      customer_id: '',
                      description: '',
                      start_date: new Date().toISOString().split('T')[0],
                      end_date: '',
                      is_active: true,
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Discounts List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading discounts...</p>
        </div>
      ) : discounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Tag className="w-8 h-8 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">No discounts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {discounts.map((discount) => (
            <Card key={discount.id} className={!discount.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {discount.discount_value}
                        {discount.discount_type === 'percentage' ? '%' : ' ' + formatPrice(discount.discount_value)}
                      </span>
                      <span className="text-sm text-slate-600">
                        → {formatPrice(calculateDiscountedPrice(discount))}
                      </span>
                      {!discount.is_active && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactive</span>}
                    </div>
                    {discount.customer_id && <p className="text-sm text-slate-600 mt-1">Customer: {discount.customer_id}</p>}
                    {discount.description && <p className="text-sm text-slate-600">{discount.description}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      {discount.start_date}
                      {discount.end_date ? ` to ${discount.end_date}` : ' (No end date)'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setFormData({
                        discount_type: discount.discount_type,
                        discount_value: discount.discount_value.toString(),
                        customer_id: discount.customer_id || '',
                        description: discount.description || '',
                        start_date: discount.start_date,
                        end_date: discount.end_date || '',
                        is_active: discount.is_active,
                      })
                      setEditingId(discount.id)
                      setShowForm(true)
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(discount.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Close Button */}
      <Button variant="outline" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  )
}
