"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SupabaseEmailConfigHelper() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Email Confirmation Setup
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure Supabase to allow immediate login after signup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm text-foreground">
              By default, Supabase requires email confirmation. Users must click a link in their email before they can
              login. Follow the steps below to disable this for development or internal use.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Steps to Disable Email Confirmation:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your Supabase Dashboard</li>
              <li>
                Navigate to <strong className="text-foreground">Authentication</strong> →{" "}
                <strong className="text-foreground">Settings</strong>
              </li>
              <li>
                Scroll down to <strong className="text-foreground">Email Auth</strong> section
              </li>
              <li>
                Toggle <strong className="text-foreground">OFF</strong> the option:{" "}
                <code className="px-2 py-1 bg-muted rounded text-xs text-foreground">Enable email confirmations</code>
              </li>
              <li>Click Save</li>
            </ol>
          </div>

          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm text-foreground">
              After disabling email confirmation, users can login immediately after signup without needing to confirm
              their email.
            </AlertDescription>
          </Alert>

          <div className="pt-4">
            <h3 className="font-semibold text-foreground mb-2">Quick Link:</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-xs text-foreground">
                https://supabase.com/dashboard/project/_/auth/settings
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText("https://supabase.com/dashboard/project/_/auth/settings")
                  handleCopy()
                }}
                className="border-border text-foreground hover:bg-accent"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
