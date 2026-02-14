"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function BusinessInfo() {
  const [businessName, setBusinessName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
    fetchBusiness(businessId)

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchBusiness(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    return () => window.removeEventListener("businessChanged", handleBusinessChange)
  }, [])

  const fetchBusiness = async (businessId: string | null) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return
    setUserId(user.id)

    let query = supabase.from("businesses").select("*").eq("user_id", user.id)

    if (businessId) {
      query = query.eq("id", businessId)
    }

    const { data } = await query.single()

    if (data) {
      setBusinessName(data.name || "")
      setAddress(data.address || "")
      setCity(data.city || "")
      setCountry(data.country || "")
      setPhone(data.phone || "")
    } else {
      // Clear form if no business found
      setBusinessName("")
      setAddress("")
      setCity("")
      setCountry("")
      setPhone("")
    }
  }

  const handleSave = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const supabase = createClient()

      if (currentBusinessId) {
        // Update existing business
        const { error } = await supabase
          .from("businesses")
          .update({
            name: businessName,
            address,
            city,
            country,
            phone,
          })
          .eq("id", currentBusinessId)

        if (error) throw error
      } else {
        // Create new business if none selected
        const { error } = await supabase.from("businesses").insert({
          user_id: userId,
          name: businessName,
          address,
          city,
          country,
          phone,
        })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Business information updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Business Information</CardTitle>
        <CardDescription>
          {currentBusinessId ? "Update your current business details" : "Create your first business to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="business-name" className="text-sm font-medium text-foreground">
              Business Name
            </Label>
            <Input
              id="business-name"
              placeholder="Enter business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-foreground">
              Address
            </Label>
            <Textarea
              id="address"
              placeholder="Enter street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-foreground">
                City
              </Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-foreground">
                Country
              </Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Business Info"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
