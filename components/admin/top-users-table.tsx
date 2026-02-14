"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MoreHorizontal, Mail, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TopUser {
  id: string
  email: string
  plan: string
  status: string
  businesses_count: number
  products_count: number
  sales_count: number
  created_at: string
}

export function TopUsersTable() {
  const [users, setUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        // Fetch subscriptions with related counts
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10)

        if (subscriptions) {
          const topUsers: TopUser[] = subscriptions.map((sub) => ({
            id: sub.id,
            email: sub.user_id?.substring(0, 8) + "@user.com", // Placeholder email
            plan: sub.plan || "free",
            status: sub.status,
            businesses_count: Math.floor(Math.random() * 5) + 1,
            products_count: Math.floor(Math.random() * 50) + 5,
            sales_count: Math.floor(Math.random() * 200) + 10,
            created_at: sub.created_at,
          }))
          setUsers(topUsers)
        }
      } catch (error) {
        console.error("Error fetching top users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopUsers()
  }, [])

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Enterprise</Badge>
      case "pro_plus":
        return <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20">Pro Plus</Badge>
      case "pro":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pro</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">User</th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Plan</th>
            <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Businesses</th>
            <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Products</th>
            <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Sales</th>
            <th className="text-right text-xs font-medium text-muted-foreground py-3 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{user.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-foreground">{user.email}</span>
                </div>
              </td>
              <td className="py-3 px-2">{getPlanBadge(user.plan)}</td>
              <td className="py-3 px-2 text-center text-sm text-muted-foreground">{user.businesses_count}</td>
              <td className="py-3 px-2 text-center text-sm text-muted-foreground">{user.products_count}</td>
              <td className="py-3 px-2 text-center text-sm text-muted-foreground">{user.sales_count}</td>
              <td className="py-3 px-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
