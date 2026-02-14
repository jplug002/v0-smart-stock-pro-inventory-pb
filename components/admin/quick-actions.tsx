"use client"

import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Download, Settings, Shield, CreditCard, FileText, Bell } from "lucide-react"

export function QuickActions() {
  const actions = [
    { label: "Add User", icon: UserPlus, onClick: () => (window.location.href = "/admin/users?action=add") },
    {
      label: "Send Announcement",
      icon: Mail,
      onClick: () => (window.location.href = "/admin/communications?action=new"),
    },
    { label: "Export Data", icon: Download, onClick: () => alert("Export functionality coming soon") },
    { label: "View Logs", icon: FileText, onClick: () => (window.location.href = "/admin/activity-logs") },
    { label: "Manage Plans", icon: CreditCard, onClick: () => (window.location.href = "/admin/subscriptions") },
    {
      label: "Send Notification",
      icon: Bell,
      onClick: () => (window.location.href = "/admin/communications?tab=notifications"),
    },
    {
      label: "Security Settings",
      icon: Shield,
      onClick: () => (window.location.href = "/admin/settings?tab=security"),
    },
    { label: "System Config", icon: Settings, onClick: () => (window.location.href = "/admin/settings") },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="justify-start gap-2 h-auto py-3 px-3 text-left bg-transparent"
            onClick={action.onClick}
          >
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs">{action.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
