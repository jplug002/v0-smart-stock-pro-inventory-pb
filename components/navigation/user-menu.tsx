"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Settings, User, Lock, Shield, ChevronDown } from "lucide-react"

interface UserMenuProps {
  userEmail?: string
}

export default function UserMenu({ userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/auth/login"
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {userEmail?.charAt(0).toUpperCase() || "U"}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-2 z-50">
          {/* User Email Display */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">{userEmail}</p>
            <p className="text-xs text-muted-foreground">Manage your account</p>
          </div>

          {/* Settings Options */}
          <Link href="/settings">
            <button className="w-full px-4 py-2 flex items-center gap-3 text-foreground hover:bg-muted transition-colors text-sm">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </Link>

          <div className="px-4 py-2 space-y-1 border-t border-border">
            <Link href="/settings#account">
              <button className="w-full px-3 py-2 flex items-center gap-2 text-muted-foreground hover:bg-muted rounded transition-colors text-sm ml-2">
                <User className="w-3.5 h-3.5" />
                Account
              </button>
            </Link>
            <Link href="/settings#business">
              <button className="w-full px-3 py-2 flex items-center gap-2 text-muted-foreground hover:bg-muted rounded transition-colors text-sm ml-2">
                <Shield className="w-3.5 h-3.5" />
                Business
              </button>
            </Link>
            <Link href="/settings#billing">
              <button className="w-full px-3 py-2 flex items-center gap-2 text-muted-foreground hover:bg-muted rounded transition-colors text-sm ml-2">
                <Lock className="w-3.5 h-3.5" />
                Billing
              </button>
            </Link>
            <Link href="/settings#preferences">
              <button className="w-full px-3 py-2 flex items-center gap-2 text-muted-foreground hover:bg-muted rounded transition-colors text-sm ml-2">
                <User className="w-3.5 h-3.5" />
                Preferences
              </button>
            </Link>
            <Link href="/settings#support">
              <button className="w-full px-3 py-2 flex items-center gap-2 text-muted-foreground hover:bg-muted rounded transition-colors text-sm ml-2">
                <Shield className="w-3.5 h-3.5" />
                Support
              </button>
            </Link>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors text-sm border-t border-border mt-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
