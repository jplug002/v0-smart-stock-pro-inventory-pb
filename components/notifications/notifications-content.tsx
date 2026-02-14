"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Trash2, CheckCircle2, AlertCircle } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  product_id: string | null
  is_read: boolean
  created_at: string
  product_name?: string
}

export default function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  useEffect(() => {
    const businessId = localStorage.getItem("currentBusinessId")
    setCurrentBusinessId(businessId)
    fetchNotifications(businessId)

    const handleBusinessChange = () => {
      const newBusinessId = localStorage.getItem("currentBusinessId")
      setCurrentBusinessId(newBusinessId)
      fetchNotifications(newBusinessId)
    }

    window.addEventListener("businessChanged", handleBusinessChange)
    const interval = setInterval(() => fetchNotifications(localStorage.getItem("currentBusinessId")), 30000)

    return () => {
      window.removeEventListener("businessChanged", handleBusinessChange)
      clearInterval(interval)
    }
  }, [])

  const fetchNotifications = async (businessId: string | null) => {
    try {
      const supabase = createClient()

      let notificationsQuery = supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (businessId) {
        notificationsQuery = notificationsQuery.eq("business_id", businessId)
      }

      const { data: notificationsData, error: notificationsError } = await notificationsQuery

      if (notificationsError) throw notificationsError

      let productsQuery = supabase.from("products").select("id, name")
      if (businessId) {
        productsQuery = productsQuery.eq("business_id", businessId)
      }
      const { data: productsData } = await productsQuery

      const productMap = new Map(productsData?.map((p) => [p.id, p.name]) || [])

      const enrichedNotifications = (notificationsData || []).map((notif) => ({
        ...notif,
        product_name: notif.product_id ? productMap.get(notif.product_id) : null,
      }))

      setNotifications(enrichedNotifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error
      setNotifications(notifications.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const supabase = createClient()
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)

      if (error) throw error
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              Mark all as read
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
            All ({notifications.length})
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} onClick={() => setFilter("unread")} size="sm">
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${!notification.is_read ? "border-primary/30 bg-primary/5" : ""} hover:shadow-md transition-shadow`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {notification.type === "low_stock" ? (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          {!notification.is_read && (
                            <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        {notification.product_name && (
                          <p className="text-xs text-muted-foreground mt-2">Product: {notification.product_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-primary hover:text-primary"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
