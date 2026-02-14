"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle, AlertCircle, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Component to help users get their user ID for admin access
export default function AdminAccessHelper() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUserId(user.id)
          setUserEmail(user.email || null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
        <Mail className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-sm">
          <strong>Having trouble logging in?</strong> If users see "Invalid credentials" after signup, you may need to
          disable email confirmation in Supabase.{" "}
          <Link href="/email-config" className="text-primary hover:underline font-medium">
            Click here for setup instructions
          </Link>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Admin Access Setup
          </CardTitle>
          <CardDescription>Follow these steps to grant yourself admin access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: User Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Step 1: Your User Information</h3>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="font-mono text-sm text-foreground">{userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-foreground break-all">{userId}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => userId && copyToClipboard(userId)}
                    className="flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: SQL Script */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Step 2: Run SQL Script</h3>
            <p className="text-sm text-muted-foreground">
              Copy this SQL query and run it in the v0 SQL runner (look for the script file in the Scripts folder):
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {`-- Grant admin access
INSERT INTO public.admin_users (user_id, role, is_active)
VALUES ('${userId}', 'super_admin', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = now();`}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(`INSERT INTO public.admin_users (user_id, role, is_active)
VALUES ('${userId}', 'super_admin', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = now();`)
                }
                className="mt-3"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy SQL
              </Button>
            </div>
          </div>

          {/* Step 3: Access Admin */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Step 3: Access Admin Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              After running the SQL script, you can access the admin dashboard at:
            </p>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <a href="/admin" className="text-primary hover:underline font-medium">
                /admin
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
