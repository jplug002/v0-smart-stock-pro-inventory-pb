"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AdminDashboardContent from "@/components/admin/admin-dashboard-content"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const ADMIN_EMAIL = "admin@smartstockspro.com"
  const ADMIN_PASSWORD = "SmartStocksPro@123$$"

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true)
        setError(null)
      } else {
        throw new Error("Invalid admin credentials")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated) {
    return <AdminDashboardContent />
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Enter your admin credentials to access the dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Admin Login</CardTitle>
              <CardDescription>Only authorized administrators can access this area</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin}>
                <div className="flex flex-col gap-4">
                  {/* Email Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="admin-email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@smartstockspro.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="admin-password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Access Admin Dashboard"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Back to Dashboard Link */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => (window.location.href = "/dashboard")} className="text-sm">
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
