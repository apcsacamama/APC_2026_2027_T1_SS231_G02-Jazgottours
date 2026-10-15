import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahvfnuwdglbohtxwmrfc.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodmZudXdkZ2xib2h0eHdtcmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzY4ODEsImV4cCI6MjEwMzE1Mjg4MX0.F6vljBSLGHoNFL1D5gRjkj--0s3EF2epzjb6YOa7G7s',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server component ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const userEmail = user.email.toLowerCase()
        const selectedRole = searchParams.get('selected_role') || 'staff'

        // Check if user already exists in public.user table
        const { data: dbUser } = await supabase
          .from('user')
          .select('role, full_name')
          .eq('email', userEmail)
          .maybeSingle()

        let effectiveRole = dbUser?.role || selectedRole
        if (userEmail === 'admin@jazgottours.com') {
          effectiveRole = 'admin'
        } else if (userEmail.endsWith('@jazgottours.com')) {
          // Role already resolved from dbUser or selectedRole above;
          // no further domain-based override needed.
          effectiveRole = dbUser?.role || selectedRole
        }

        const fullName = dbUser?.full_name || 
          user.user_metadata?.full_name || 
          user.user_metadata?.name || 
          userEmail.split('@')[0]

        // Keep metadata synchronized
        await supabase.auth.updateUser({
          data: {
            role: effectiveRole,
            full_name: fullName,
          }
        })

        // Also update/insert into public.user table
        await supabase.from('user').upsert({
          id: user.id,
          email: userEmail,
          full_name: fullName,
          role: effectiveRole,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })

        // Strictly redirect to role's dashboard
        const destination = effectiveRole === 'agent' ? '/agent' : '/admin'
        return NextResponse.redirect(`${origin}${destination}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/admin/login`)
}
