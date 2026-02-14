"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"

export default function VerifySetupPage() {
  const [checks, setChecks] = useState({
    supabaseUrl: false,
    supabaseKey: false,
    redirectUrl: false,
    loaded: false,
  })

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const redirectUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL

    setChecks({
      supabaseUrl: !!url,
      supabaseKey: !!key,
      redirectUrl: !!redirectUrl,
      loaded: true,
    })
  }, [])

  if (!checks.loaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const allChecked = checks.supabaseUrl && checks.supabaseKey && checks.redirectUrl

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Setup Verification</CardTitle>
            <CardDescription>Check if your environment variables are configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supabase URL Check */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {checks.supabaseUrl ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Supabase URL</p>
                <p className="text-sm text-muted-foreground">
                  {checks.supabaseUrl ? "✓ Set" : "✗ Missing: NEXT_PUBLIC_SUPABASE_URL"}
                </p>
              </div>
            </div>

            {/* Supabase Key Check */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {checks.supabaseKey ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Supabase Anon Key</p>
                <p className="text-sm text-muted-foreground">
                  {checks.supabaseKey ? "✓ Set" : "✗ Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY"}
                </p>
              </div>
            </div>

            {/* Redirect URL Check */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {checks.redirectUrl ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Supabase Redirect URL</p>
                <p className="text-sm text-muted-foreground">
                  {checks.redirectUrl ? "✓ Set" : "✗ Missing: NEXT_PUBLIC_SUPABASE_REDIRECT_URL"}
                </p>
              </div>
            </div>

            {/* Status Alert */}
            {allChecked ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">All Set!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your environment variables are configured correctly. Email verification should work now.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Configuration Missing</AlertTitle>
                <AlertDescription className="text-red-700">
                  <p className="mb-2">Please add these environment variables to Vercel:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>NEXT_PUBLIC_SUPABASE_REDIRECT_URL (set to https://smartstockspro.com/auth/callback)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}

            {/* Setup Instructions */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-2">Setup Instructions:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Go to Vercel Dashboard → SmartStock Pro project</li>
                <li>Click Settings → Environment Variables</li>
                <li>Add the missing variables listed above</li>
                <li>Redeploy your application</li>
                <li>In Supabase, add redirect URL: https://smartstockspro.com/auth/callback</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
