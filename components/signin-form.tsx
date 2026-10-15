"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { supabase } from "@/lib/supabase"
import { formatFirstName } from "@/lib/agent-service"

export function SignInForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email")).trim().toLowerCase()
    const password = String(formData.get("password"))
    const firstName = String(formData.get("first_name") ?? "").trim()
    const lastName  = String(formData.get("last_name") ?? "").trim()
    const phone     = String(formData.get("phone") ?? "").trim()
    const fullName  = [firstName, lastName].filter(Boolean).join(" ")

    // ── Sign Up flow (client only) ──────────────────────────────────────────
    if (authMode === "signup") {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, first_name: firstName, last_name: lastName, phone } },
      })
      setIsSubmitting(false)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (!result.data.session) {
        toast.success("Account created. Check your email to confirm your address, then sign in.")
        setAuthMode("signin")
        return
      }
      toast.success("Account created successfully!")
      router.push("/")
      return
    }

    // ── Sign In flow — handles ALL roles ───────────────────────────────────
    let resolvedRole: 'admin' | 'staff' | 'agent' | 'client' = 'client'
    let resolvedName = ''
    let authenticated = false

    // 1. Try Supabase Auth first
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInError && data?.session?.user) {
      authenticated = true
      const authUser = data.session.user
      const metaRole = authUser.user_metadata?.role as string | undefined
      resolvedRole = (['admin', 'staff', 'agent'].includes(metaRole ?? '') ? metaRole : 'client') as typeof resolvedRole
      resolvedName = formatFirstName(
        authUser.user_metadata?.given_name ||
        authUser.user_metadata?.first_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        email
      )
    } else {
      // 2. Fall back to public.user table (provisioned portal accounts)
      const { data: userRow } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle()

      if (userRow) {
        authenticated = true
        resolvedRole = (['admin', 'staff', 'agent'].includes(userRow.role) ? userRow.role : 'client') as typeof resolvedRole
        resolvedName = formatFirstName(userRow.full_name || userRow.username || email)
      }
    }

    if (!authenticated) {
      setIsSubmitting(false)
      toast.error(signInError?.message ?? 'Invalid email or password. Please try again.')
      return
    }

    // Override role based on specific portal email domains only
    if (resolvedRole === 'client') {
      if (email.endsWith('@agent.jgt.com')) resolvedRole = 'agent'
      else if (email.endsWith('@staff.jgt.com')) resolvedRole = 'staff'
      else if (email === 'admin@jazgottours.com') resolvedRole = 'admin'
    }

    // Persist portal session data for admin/staff/agent layouts
    if (resolvedRole !== 'client') {
      localStorage.setItem('jazgot_user_role', resolvedRole)
      localStorage.setItem('jazgot_user_first_name', resolvedName)
      localStorage.setItem('jazgot_user_email', email)

      if (resolvedRole === 'agent') {
        const dynamicAgent = {
          id: `ag-${resolvedName.toLowerCase()}`,
          name: resolvedName,
          email,
          code: `JAZ-AGT-${resolvedName.slice(0, 3).toUpperCase()}`,
          defaultMarkup: 500,
        }
        localStorage.setItem('jazgot_active_agent', JSON.stringify(dynamicAgent))
        setIsSubmitting(false)
        window.location.href = '/agent'
        return
      }

      setIsSubmitting(false)
      window.location.href = '/admin'
      return
    }

    // Client — just stay on the site
    setIsSubmitting(false)
    toast.success("Signed in successfully!")
    router.push("/")
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Dynamic Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {authMode === "signin" ? "Welcome back" : "Create an Account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authMode === "signin"
            ? "Sign in to manage your bookings and tours."
            : "Sign up to start booking your unforgettable memories."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
      >
        <FieldGroup>
          {authMode === "signup" && (
            <>
              {/* Name row — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                  <Input id="first_name" name="first_name" type="text" placeholder="Juan" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                  <Input id="last_name" name="last_name" type="text" placeholder="Dela Cruz" required />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input id="phone" name="phone" type="tel" placeholder="+63 912 345 6789" required />
              </Field>
            </>
          )}


          {authMode === "signin" && (
            <Field>
              <FieldLabel htmlFor="signin_name">Name</FieldLabel>
              <Input id="signin_name" name="signin_name" type="text" placeholder="Your name" />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </Field>

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : authMode === "signin" ? "Sign In" : "Sign Up"}
          </Button>

          <FieldDescription className="text-center mt-4">
            {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              {authMode === "signin" ? "Create an account" : "Sign in here"}
            </button>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  )
}