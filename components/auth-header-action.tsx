"use client"

import Link from "next/link"
import { LogOut, UserRound } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

export function AuthHeaderAction() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <span className="size-8" aria-hidden="true" />
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground/10"
      >
        <UserRound className="size-3.5" aria-hidden="true" />
        SIGN IN
      </Link>
    )
  }

  async function handleSignOut() {
    // Clear portal localStorage keys if present
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jazgot_user_role')
      localStorage.removeItem('jazgot_user_first_name')
      localStorage.removeItem('jazgot_user_email')
      localStorage.removeItem('jazgot_pending_role')
      localStorage.removeItem('jazgot_active_agent')
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Signed out")
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs font-medium sm:block">{user.email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        title="Sign out"
        aria-label="Sign out"
        className="inline-flex size-8 items-center justify-center rounded-md border border-primary-foreground/70 text-primary-foreground transition-colors hover:bg-primary-foreground/10"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}