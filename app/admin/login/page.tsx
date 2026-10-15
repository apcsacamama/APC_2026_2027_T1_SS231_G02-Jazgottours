"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { FiMail, FiLock, FiArrowRight, FiShield, FiUserCheck, FiBriefcase, FiX, FiCheckCircle, FiUser } from 'react-icons/fi'
import { formatFirstName } from '@/lib/agent-service'

type Role = 'admin' | 'staff' | 'agent'

interface RoleOption {
  value: Role
  label: string
  subtitle: string
  icon: any
}

const ROLES: RoleOption[] = [
  { 
    value: 'admin',  
    label: 'Admin',  
    subtitle: 'Full System Control',
    icon: FiShield
  },
  { 
    value: 'staff',  
    label: 'Staff',  
    subtitle: 'Operations & Bookings',
    icon: FiUserCheck
  },
  { 
    value: 'agent',  
    label: 'Agent',  
    subtitle: 'Tours & Quotations',
    icon: FiBriefcase
  },
]

export default function AdminLogin() {
  const [role, setRole] = useState<Role>('admin')
  const [email, setEmail] = useState('')
  const [firstNameInput, setFirstNameInput] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('jazgot_user_email')
      const savedRole = localStorage.getItem('jazgot_user_role')
      if (savedEmail) {
        if (savedRole === 'agent') {
          router.replace('/agent')
        } else {
          router.replace('/admin')
        }
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      let resolvedRole: Role = role
      let resolvedName = firstNameInput
      let authenticated = false

      // 1. First attempt standard Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (!signInError && data?.session?.user) {
        authenticated = true
        const authUser = data.session.user
        resolvedRole = (authUser.user_metadata?.role as Role) || role
        resolvedName = formatFirstName(
          firstNameInput ||
          authUser.user_metadata?.given_name ||
          authUser.user_metadata?.first_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          cleanEmail
        )

        // Keep auth metadata updated
        await supabase.auth.updateUser({ 
          data: { 
            role: resolvedRole,
            first_name: resolvedName,
            name: resolvedName 
          } 
        })
      } else {
        // 2. Check public.user table for provisioned credentials
        const { data: userRow } = await supabase
          .from('user')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', password)
          .maybeSingle()

        if (userRow) {
          authenticated = true
          resolvedRole = (userRow.role as Role) || role
          resolvedName = formatFirstName(
            firstNameInput ||
            userRow.full_name ||
            userRow.username ||
            cleanEmail
          )
        } else {
          setError(signInError?.message ?? 'Invalid email or password. Please try again.')
          setLoading(false)
          return
        }
      }

      if (authenticated) {
        // If the email domain explicitly dictates the role, prioritize it
        if (cleanEmail.includes('@agent.jgt.com') || cleanEmail.includes('agent')) {
          resolvedRole = 'agent'
        } else if (cleanEmail.includes('@staff.jgt.com') || cleanEmail.includes('staff')) {
          resolvedRole = 'staff'
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('jazgot_user_role', resolvedRole)
          localStorage.setItem('jazgot_user_first_name', resolvedName)
          localStorage.setItem('jazgot_user_email', cleanEmail)

          if (resolvedRole === 'agent') {
            const dynamicAgent = {
              id: `ag-${resolvedName.toLowerCase()}`,
              name: resolvedName,
              email: cleanEmail,
              code: `JAZ-AGT-${resolvedName.slice(0, 3).toUpperCase()}`,
              defaultMarkup: 500
            }
            localStorage.setItem('jazgot_active_agent', JSON.stringify(dynamicAgent))
          }
        }

        // Strict role-specific dashboard redirection
        if (resolvedRole === 'agent') {
          window.location.href = '/agent'
        } else {
          window.location.href = '/admin'
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }


  // Forgot Password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return

    setForgotLoading(true)
    setForgotError(null)
    setForgotSuccess(null)

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/admin/login?reset=true`
      })

      if (resetErr) {
        setForgotError(resetErr.message)
      } else {
        setForgotSuccess(`Password reset instructions sent to ${forgotEmail}. Please check your inbox.`)
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send reset link.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1e8] via-[#ece3d0] to-[#decaa3] p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_12px_40px_rgb(180,130,50,0.15)] border border-amber-200/60 space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-amber-100">
          <Logo className="h-11" />
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-amber-900">
              Jazgot Portal Authentication
            </p>
          </div>
        </div>

        {/* Category / Role Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Sign In Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon
              const isSelected = role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#dfa241] bg-amber-50/80 shadow-xs scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 text-slate-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}>
                    {r.label}
                  </span>
                  <span className={`text-[9px] font-medium leading-tight ${isSelected ? 'text-amber-700' : 'text-slate-400'}`}>
                    {r.subtitle}
                  </span>
                </button>
              )
            })}
          </div>
        </div>


        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wide">
              {role === 'admin' ? 'Admin Email' : role === 'staff' ? 'Staff Email' : 'Agent Email'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiMail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === 'agent' 
                    ? 'rio@agent.jgt.com' 
                    : role === 'staff' 
                    ? 'rio@staff.jgt.com' 
                    : 'admin@jazgottours.com'
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                First Name
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Auto-detected if left blank</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiUser size={15} />
              </div>
              <input
                type="text"
                value={firstNameInput}
                onChange={(e) => setFirstNameInput(e.target.value)}
                placeholder="e.g. Clarice"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setShowForgotModal(true)
                  setForgotSuccess(null)
                  setForgotError(null)
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiLock size={15} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-amber-300/40 uppercase tracking-wider text-xs mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating…' : `Sign In as ${ROLES.find(r => r.value === role)?.label}`}</span>
            <FiArrowRight size={14} />
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-200/80 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your email address to receive password reset instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <FiCheckCircle size={16} /> Link Sent Successfully
                </div>
                <p className="text-[11px] leading-relaxed">{forgotSuccess}</p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-2 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your-email@jazgottours.com"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}