"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
}

export default function SupportHelp() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTickets = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setTickets(data)
      }
    }
    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("support_tickets").insert({
        user_id: userId,
        subject,
        message,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Support ticket created successfully",
      })

      setSubject("")
      setMessage("")

      // Refresh tickets
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (data) setTickets(data)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
          <CardDescription>Get help from our support team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Enter ticket subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !subject || !message}>
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
          <CardDescription>View and manage your support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{ticket.subject}</h4>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ").charAt(0).toUpperCase() +
                        ticket.status.replace("_", " ").slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{ticket.message}</p>
                  <p className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm">No tickets yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
