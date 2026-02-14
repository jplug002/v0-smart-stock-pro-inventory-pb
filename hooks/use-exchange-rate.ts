"use client"

import { useEffect, useState } from "react"

interface ExchangeRates {
  [key: string]: number
}

const CACHE_KEY = "exchange_rates_cache"
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export function useExchangeRate() {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY)
        const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`)

        if (cached && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime)
          if (cacheAge < CACHE_DURATION) {
            console.log("[v0] Using cached exchange rates")
            setRates(JSON.parse(cached))
            setLastUpdated(new Date(parseInt(cachedTime)))
            setLoading(false)
            return
          }
        }

        // Fetch from free Exchange Rate API
        const response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        )
        if (!response.ok) throw new Error("Failed to fetch exchange rates")

        const data = await response.json()
        const exchangeRates = data.rates || {}

        // Cache the rates
        localStorage.setItem(CACHE_KEY, JSON.stringify(exchangeRates))
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString())

        setRates(exchangeRates)
        setLastUpdated(new Date())
        console.log("[v0] Exchange rates updated:", exchangeRates)
      } catch (error) {
        console.error("[v0] Error fetching exchange rates:", error)
        // Use fallback rates if API fails
        const fallbackRates: ExchangeRates = {
          USD: 1,
          GHS: 12.5, // 1 USD = 12.5 GHS
          NGN: 1200,
          XOF: 590,
          GBP: 0.79,
          EUR: 0.92,
        }
        setRates(fallbackRates)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  const convertCurrency = (
    amount: number,
    fromCurrency: string = "USD",
    toCurrency: string = "USD"
  ): number => {
    if (!rates || fromCurrency === toCurrency) return amount

    const fromRate = rates[fromCurrency] || 1
    const toRate = rates[toCurrency] || 1

    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromRate
    return amountInUSD * toRate
  }

  const getExchangeRate = (
    fromCurrency: string = "USD",
    toCurrency: string = "USD"
  ): number => {
    if (!rates || fromCurrency === toCurrency) return 1

    const fromRate = rates[fromCurrency] || 1
    const toRate = rates[toCurrency] || 1

    return toRate / fromRate
  }

  return {
    rates,
    loading,
    convertCurrency,
    getExchangeRate,
    lastUpdated,
  }
}
