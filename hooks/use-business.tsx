"use client"

import type React from "react"

// Custom hook to manage the currently selected business
// Provides functions to get, set, and switch between businesses

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { createClient } from "@/lib/supabase/client"

// Business interface matching database schema
export interface Business {
  id: string
  user_id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  logo_url: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

// Context type for business state management
interface BusinessContextType {
  businesses: Business[]
  currentBusiness: Business | null
  loading: boolean
  error: string | null
  switchBusiness: (businessId: string) => Promise<void>
  createBusiness: (data: Partial<Business>) => Promise<Business | null>
  updateBusiness: (id: string, data: Partial<Business>) => Promise<boolean>
  deleteBusiness: (id: string) => Promise<boolean>
  refreshBusinesses: () => Promise<void>
}

// Create context with default values
const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  currentBusiness: null,
  loading: true,
  error: null,
  switchBusiness: async () => {},
  createBusiness: async () => null,
  updateBusiness: async () => false,
  deleteBusiness: async () => false,
  refreshBusinesses: async () => {},
})

// Hook to access business context
export function useBusiness() {
  return useContext(BusinessContext)
}

// Provider component props
interface BusinessProviderProps {
  children: React.ReactNode
}

// Provider component to wrap the app
export function BusinessProvider({ children }: BusinessProviderProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all businesses for the current user
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch all businesses for this user
      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setBusinesses(data || [])

      // Set current business from localStorage or default
      const storedBusinessId = localStorage.getItem("currentBusinessId")

      if (data && data.length > 0) {
        // Find stored business or default business or first business
        const stored = data.find((b) => b.id === storedBusinessId)
        const defaultBusiness = data.find((b) => b.is_default)
        const businessToSelect = stored || defaultBusiness || data[0]

        setCurrentBusiness(businessToSelect)
        localStorage.setItem("currentBusinessId", businessToSelect.id)
      } else {
        setCurrentBusiness(null)
        localStorage.removeItem("currentBusinessId")
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching businesses:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  // Switch to a different business
  const switchBusiness = useCallback(
    async (businessId: string) => {
      const business = businesses.find((b) => b.id === businessId)
      if (business) {
        setCurrentBusiness(business)
        localStorage.setItem("currentBusinessId", businessId)

        // Optionally update the default business in the database
        const supabase = createClient()

        // Reset all businesses to non-default
        await supabase.from("businesses").update({ is_default: false }).eq("user_id", business.user_id)

        // Set selected business as default
        await supabase.from("businesses").update({ is_default: true }).eq("id", businessId)
      }
    },
    [businesses],
  )

  // Create a new business
  const createBusiness = useCallback(
    async (data: Partial<Business>): Promise<Business | null> => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return null

        // If this is the first business, make it default
        const isFirstBusiness = businesses.length === 0

        const { data: newBusiness, error: insertError } = await supabase
          .from("businesses")
          .insert({
            user_id: user.id,
            name: data.name || "New Business",
            address: data.address || null,
            city: data.city || null,
            country: data.country || null,
            phone: data.phone || null,
            logo_url: data.logo_url || null,
            is_default: isFirstBusiness,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Refresh the businesses list
        await fetchBusinesses()

        // If it's the first business, switch to it
        if (isFirstBusiness && newBusiness) {
          setCurrentBusiness(newBusiness)
          localStorage.setItem("currentBusinessId", newBusiness.id)
        }

        return newBusiness
      } catch (err: any) {
        setError(err.message)
        console.error("Error creating business:", err)
        return null
      }
    },
    [businesses.length, fetchBusinesses],
  )

  // Update an existing business
  const updateBusiness = useCallback(
    async (id: string, data: Partial<Business>): Promise<boolean> => {
      try {
        const supabase = createClient()

        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            name: data.name,
            address: data.address,
            city: data.city,
            country: data.country,
            phone: data.phone,
            logo_url: data.logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (updateError) throw updateError

        // Refresh businesses list
        await fetchBusinesses()
        return true
      } catch (err: any) {
        setError(err.message)
        console.error("Error updating business:", err)
        return false
      }
    },
    [fetchBusinesses],
  )

  // Delete a business
  const deleteBusiness = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Prevent deleting the last business
        if (businesses.length <= 1) {
          setError("Cannot delete your only business")
          return false
        }

        const supabase = createClient()

        const { error: deleteError } = await supabase.from("businesses").delete().eq("id", id)

        if (deleteError) throw deleteError

        // If we deleted the current business, switch to another
        if (currentBusiness?.id === id) {
          const remaining = businesses.filter((b) => b.id !== id)
          if (remaining.length > 0) {
            await switchBusiness(remaining[0].id)
          }
        }

        // Refresh businesses list
        await fetchBusinesses()
        return true
      } catch (err: any) {
        setError(err.message)
        console.error("Error deleting business:", err)
        return false
      }
    },
    [businesses, currentBusiness, fetchBusinesses, switchBusiness],
  )

  // Context value
  const value: BusinessContextType = {
    businesses,
    currentBusiness,
    loading,
    error,
    switchBusiness,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    refreshBusinesses: fetchBusinesses,
  }

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}
