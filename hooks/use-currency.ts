"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js" // Import User type for type safety

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GHS: "₵",
  NGN: "₦",
  XOF: "Fr",
  GBP: "£",
  EUR: "€",
}

export function useCurrency() {
  const [currency, setCurrency] = useState("GHS") // Default to GHS instead of USD
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null) // Declare user state

  const refreshCurrency = async () => {
    try {
      const supabase = createClient()
      const { user } = await supabase.auth.getUser()

      if (!user) return

      const { data: prefs, error } = await supabase
        .from("user_preferences")
        .select("currency")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is okay
        console.error("[v0] Supabase error:", error)
      }

      if (prefs?.currency) {
        setCurrency(prefs.currency)
        localStorage.setItem(`user_currency_${user.id}`, prefs.currency)
      } else {
        setCurrency("GHS")
        localStorage.setItem(`user_currency_${user.id}`, "GHS")
      }
    } catch (error) {
      console.error("[v0] Error refreshing currency:", error)
      setCurrency("GHS")
    }
  }

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const supabase = createClient()
        const { user } = await supabase.auth.getUser()

        setUser(user) // Set user state

        if (!user) {
          setLoading(false)
          return
        }

        // Check localStorage first for instant load
        const cached = localStorage.getItem(`user_currency_${user.id}`)
        if (cached) {
          setCurrency(cached)
        }

        const { data: prefs, error } = await supabase
          .from("user_preferences")
          .select("currency")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned, which is okay
          console.error("[v0] Supabase error:", error)
        }

        if (prefs?.currency) {
          setCurrency(prefs.currency)
          localStorage.setItem(`user_currency_${user.id}`, prefs.currency)
        } else {
          // No preferences found, use default
          setCurrency("GHS")
          localStorage.setItem(`user_currency_${user.id}`, "GHS")
        }
      } catch (dbError) {
        console.error("[v0] Database fetch error:", dbError)
        // Use cached value or default
        const cached = localStorage.getItem(`user_currency_${user.id}`)
        setCurrency(cached || "GHS")
      } finally {
        setLoading(false)
      }
    }

    fetchCurrency()

    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrency(e.detail.currency)
    }

    window.addEventListener("currencyChanged", handleCurrencyChange as EventListener)

    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange as EventListener)
    }
  }, [])

  const getSymbol = (curr?: string) => CURRENCY_SYMBOLS[curr || currency] || "₵" // Default to ₵

  const formatPrice = (amount: number, curr?: string) => {
    const symbol = getSymbol(curr)
    return `${symbol}${amount.toFixed(2)}`
  }

  return {
    currency,
    setCurrency,
    getSymbol,
    formatPrice,
    loading,
    refreshCurrency, // Export refresh function
    user, // Export user state
  }
}
