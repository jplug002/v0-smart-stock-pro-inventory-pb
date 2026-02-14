"use client"

import { useState } from "react"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Settings, Shield, Bell, Database, Key, Save, RefreshCw, AlertTriangle } from "lucide-react"

export default function AdminSettingsPage() {
  // General settings
  const [siteName, setSiteName] = useState("SmartStocks Pro")
  const [supportEmail, setSupportEmail] = useState("support@smartstocks.pro")
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Security settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [passwordMinLength, setPasswordMinLength] = useState("8")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slackIntegration, setSlackIntegration] = useState(false)
  const [dailyReports, setDailyReports] = useState(true)

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSaving(false)
    alert("Settings saved successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1200px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">Configure platform settings and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable access for non-admin users</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>

                {maintenanceMode && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-600">
                      Maintenance mode is enabled. Users cannot access the platform.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
                  </div>
                  <Switch checked={twoFactorRequired} onCheckedChange={setTwoFactorRequired} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-length">Minimum Password Length</Label>
                    <Input
                      id="password-length"
                      type="number"
                      value={passwordMinLength}
                      onChange={(e) => setPasswordMinLength(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>API Keys</Label>
                  <div className="flex items-center gap-2">
                    <Input value="sk_live_••••••••••••••••" readOnly className="bg-background font-mono" />
                    <Button variant="outline" size="icon">
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Last regenerated: Dec 1, 2025</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure admin notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">Send notifications to a Slack channel</p>
                  </div>
                  <Switch checked={slackIntegration} onCheckedChange={setSlackIntegration} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summary reports via email</p>
                  </div>
                  <Switch checked={dailyReports} onCheckedChange={setDailyReports} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Database status and maintenance tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-emerald-500">Connected</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="text-lg font-semibold text-foreground">245 MB</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="text-lg font-semibold text-foreground">2 hours ago</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Maintenance Actions</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Optimize Tables
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-600 bg-transparent">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
