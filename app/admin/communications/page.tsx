"use client"

import { useState } from "react"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Bell, Send, Users, Clock, CheckCircle, Megaphone } from "lucide-react"

export default function CommunicationsPage() {
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [targetAudience, setTargetAudience] = useState("all")
  const [sendingEmail, setSendingEmail] = useState(false)

  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [notificationType, setNotificationType] = useState("info")
  const [sendingNotification, setSendingNotification] = useState(false)

  // Sample sent messages
  const recentMessages = [
    {
      id: 1,
      type: "email",
      subject: "New Feature Announcement",
      audience: "All Users",
      sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "delivered",
      recipients: 1250,
    },
    {
      id: 2,
      type: "notification",
      subject: "System Maintenance Notice",
      audience: "Pro Users",
      sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "delivered",
      recipients: 450,
    },
    {
      id: 3,
      type: "email",
      subject: "Holiday Sale - 20% Off",
      audience: "Free Users",
      sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "delivered",
      recipients: 800,
    },
  ]

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) return
    setSendingEmail(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSendingEmail(false)
    setEmailSubject("")
    setEmailBody("")
    alert("Email sent successfully!")
  }

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationBody) return
    setSendingNotification(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSendingNotification(false)
    setNotificationTitle("")
    setNotificationBody("")
    alert("Notification sent successfully!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Communications</h1>
          <p className="text-muted-foreground mt-1">Send emails and notifications to users</p>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Compose Email
                  </CardTitle>
                  <CardDescription>Send bulk emails to users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="free">Free Users</SelectItem>
                        <SelectItem value="pro">Pro Users</SelectItem>
                        <SelectItem value="pro_plus">Pro Plus Users</SelectItem>
                        <SelectItem value="enterprise">Enterprise Users</SelectItem>
                        <SelectItem value="inactive">Inactive Users (30+ days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                      id="body"
                      placeholder="Write your email message..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-[200px] bg-background"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        Targeting ~{targetAudience === "all" ? "1,250" : Math.floor(Math.random() * 500 + 100)} users
                      </span>
                    </div>
                    <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody}>
                      {sendingEmail ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Quick start with templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { name: "Welcome Email", desc: "New user onboarding" },
                    { name: "Feature Update", desc: "Announce new features" },
                    { name: "Promotion", desc: "Sales and discounts" },
                    { name: "Re-engagement", desc: "Bring back inactive users" },
                  ].map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 bg-transparent"
                      onClick={() => {
                        setEmailSubject(template.name)
                        setEmailBody(`This is a ${template.name.toLowerCase()} template...`)
                      }}
                    >
                      <div className="text-left">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.desc}</p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Push Notification
                  </CardTitle>
                  <CardDescription>Send in-app notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notif-type">Notification Type</Label>
                    <Select value={notificationType} onValueChange={setNotificationType}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notif-title">Title</Label>
                    <Input
                      id="notif-title"
                      placeholder="Notification title..."
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notif-body">Message</Label>
                    <Textarea
                      id="notif-body"
                      placeholder="Notification message..."
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      className="min-h-[120px] bg-background"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-4">
                    <Button
                      onClick={handleSendNotification}
                      disabled={sendingNotification || !notificationTitle || !notificationBody}
                    >
                      {sendingNotification ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Megaphone className="w-4 h-4 mr-2" />
                          Send Notification
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How it will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          notificationType === "warning"
                            ? "bg-amber-500/10"
                            : notificationType === "success"
                              ? "bg-emerald-500/10"
                              : notificationType === "urgent"
                                ? "bg-red-500/10"
                                : "bg-blue-500/10"
                        }`}
                      >
                        <Bell
                          className={`w-4 h-4 ${
                            notificationType === "warning"
                              ? "text-amber-500"
                              : notificationType === "success"
                                ? "text-emerald-500"
                                : notificationType === "urgent"
                                  ? "text-red-500"
                                  : "text-blue-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{notificationTitle || "Notification Title"}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificationBody || "Notification message will appear here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
                <CardDescription>History of sent emails and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${msg.type === "email" ? "bg-blue-500/10" : "bg-violet-500/10"}`}
                        >
                          {msg.type === "email" ? (
                            <Mail className={`w-4 h-4 ${msg.type === "email" ? "text-blue-500" : "text-violet-500"}`} />
                          ) : (
                            <Bell className="w-4 h-4 text-violet-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{msg.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {msg.audience}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{msg.recipients} recipients</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-600 mb-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {msg.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{formatDate(msg.sent_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
