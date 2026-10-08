"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProductCard } from "@/components/product-card"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

// Import the action we created earlier
import { getPackages } from "@/lib/actions/packages"

type TourPackage = {
  id: number | string
  title: string
  description: string
  price: number
  original_price: number
  destinations: number
  image: string | null
  destination_details?: string | null
  inclusions?: string | null
  exclusions?: string | null // <-- Added exclusions type definition
}

const bookingStorageKey = "jazgot-booking"

function getMinimumTourDate() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 2)
  return date.toISOString().slice(0, 10)
}

function normalizePhilippinePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("63") ? `+${digits}` : `+63${digits.slice(1)}`
}

export function ProductsSection() {
  const router = useRouter()
  const { user } = useAuth()

  // --- Live Packages State ---
  const [livePackages, setLivePackages] = useState<TourPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

  // Auth Modals
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Tour Selection
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null)
  const [pendingTour, setPendingTour] = useState<TourPackage | null>(null)

  // Auth Form Inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clientName, setClientName] = useState("")
  
  // Booking Form Inputs
  const [guestName, setGuestName] = useState("")
  const [pax, setPax] = useState<number | "">(1)
  const [tourDate, setTourDate] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // --- Fetch Packages on Load ---
  useEffect(() => {
    const fetchLiveTours = async () => {
      try {
        const data = await getPackages()
        setLivePackages((data || []) as TourPackage[])
      } catch (err) {
        console.error("Failed to load tour packages:", err)
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchLiveTours()
  }, [])

  useEffect(() => {
    if (!selectedTour) return

    let cancelled = false
    const loadAvailability = async () => {
      setAvailabilityLoading(true)
      try {
        const response = await fetch(`/api/checkout?packageId=${encodeURIComponent(selectedTour.id)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Could not load tour availability")
        if (!cancelled) setBookedDates(data.bookedDates as string[])
      } catch (error) {
        console.error("Failed to load tour availability:", error)
        if (!cancelled) toast.error("Could not load tour availability. Please try again.")
      } finally {
        if (!cancelled) setAvailabilityLoading(false)
      }
    }

    loadAvailability()
    return () => { cancelled = true }
  }, [selectedTour])

  // --- DYNAMIC PRICE CALCULATION ---
  const currentPax = typeof pax === "number" && pax > 0 ? pax : 1
  const basePrice = selectedTour?.price || 1350
  const totalAmount = basePrice * currentPax

  // --- LOGIC HANDLERS ---
  const handleTourClick = (tour: TourPackage) => {
    if (!user) {
      setPendingTour(tour)
      setShowAuthModal(true)
    } else {
      setSelectedTour(tour)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAuthenticating(true)

    const authResult = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: clientName } },
        })

    setIsAuthenticating(false)

    if (authResult.error) {
      toast.error(authResult.error.message)
      return
    }

    if (authMode === "signup" && !authResult.data.session) {
      toast.success("Account created. Check your email to confirm your address, then sign in.")
      setAuthMode("signin")
      return
    }

    setShowAuthModal(false)
    toast.success(authMode === "signup" ? "Account created successfully!" : "Signed in successfully!")

    if (pendingTour) {
      setSelectedTour(pendingTour)
      setPendingTour(null)
    }
  }

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTour || bookedDates.includes(tourDate) || tourDate < getMinimumTourDate()) {
      toast.error("Choose an available tour date at least 48 hours from now.")
      return
    }

    sessionStorage.setItem(bookingStorageKey, JSON.stringify({
      userId: user?.id ?? null,
      packageId: selectedTour.id,
      tourPackage: selectedTour.title,
      leadGuestName: guestName,
      pax: currentPax,
      tourDate,
      contactNumber: normalizePhilippinePhone(contactNumber),
      totalAmount,
    }))
    router.push("/checkout")
  }

  return (
    <section id="products" className="bg-background px-4 py-14 sm:px-6 relative">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Products</h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
          Discover our handpicked selection of exclusive tour packages designed to create
          unforgettable memories
        </p>
      </div>

      {loadingPackages ? (
        <div className="text-center mt-12 py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dfa241] mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading available packages...</p>
        </div>
      ) : (
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {livePackages.map((tour) => (
            <div 
              key={tour.id} 
              onClick={() => handleTourClick(tour)} 
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <ProductCard tour={{
                id: String(tour.id),
                title: tour.title,
                description: tour.description,              
                price: tour.price,
                originalPrice: tour.original_price,
                destinations: tour.destinations,
                image: tour.image || ""
              }} />
            </div>
          ))}
        </div>
      )}

      {/* 1. AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {authMode === "signin" ? "Welcome back" : "Create an Account"}
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              {authMode === "signin" 
                ? "Sign in to securely book your tour." 
                : "Sign up to secure your slot instantly."}
            </p>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 text-slate-900 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 text-slate-900 outline-none" />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAuthModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={isAuthenticating} className="flex-1 bg-[#ce9136] hover:bg-[#b87d2b] text-white py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70">
                  {isAuthenticating ? "Please wait..." : authMode === "signin" ? "Sign In & Book" : "Sign Up & Book"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                className="text-[#ce9136] font-semibold hover:underline"
              >
                {authMode === "signin" ? "Create an account" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* 2. BOOKING MODAL WITH EXCLUSIONS */}
      {user && selectedTour && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl overflow-y-auto md:overflow-hidden max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row">
            
            {/* LEFT COLUMN: Tour Details & Exclusions */}
            <div className="md:w-1/2 bg-white md:overflow-y-auto flex flex-col">
              <div className="h-48 md:h-64 lg:h-72 w-full relative shrink-0">
                <img 
                  src={selectedTour.image || "/placeholder-tour.jpg"}
                  alt={selectedTour.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 right-4 text-2xl font-bold text-white drop-shadow-md">
                  {selectedTour.title}
                </h3>
              </div>
              
              <div className="p-6 text-sm text-slate-600 space-y-5">
                <p>{selectedTour.description}</p>
                
                {selectedTour.destination_details && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 border-b pb-1">Destinations:</h4>
                    <ul className="list-disc space-y-2 pl-4 text-xs">
                      {selectedTour.destination_details.split("\n").filter(Boolean).map((destination: string, index: number) => (
                        <li key={`${index}-${destination}`}>{destination}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTour.inclusions && (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 mb-2">Inclusions:</h4>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-emerald-700">
                      {selectedTour.inclusions.split("\n").filter(Boolean).map((inclusion: string, index: number) => (
                        <li key={`${index}-${inclusion}`}>{inclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusions Section added here */}
                {selectedTour.exclusions && (
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <h4 className="font-bold text-rose-800 mb-2">Exclusions:</h4>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-rose-700">
                      {selectedTour.exclusions.split("\n").filter(Boolean).map((exclusion: string, index: number) => (
                        <li key={`${index}-${exclusion}`}>{exclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Booking Form */}
            <div className="md:w-1/2 bg-slate-50 p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 shrink-0 md:overflow-y-auto">
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Secure your slot</h3>
                    <p className="text-slate-500 text-xs mt-1">Book at least 48 hours before your tour.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                    <span className="text-xl font-bold text-[#ce9136] bg-amber-100 px-3 py-1 rounded-lg">
                      ₱{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <form id="booking-form" onSubmit={handleBookNow} className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Guest Name</label>
                    <input 
                      type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} 
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Number of Pax</label>
                      <input 
                        type="number" min="1" required value={pax} onChange={(e) => setPax(e.target.value ? parseInt(e.target.value) : "")}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tour Date</label>
                      <input 
                        type="date" min={getMinimumTourDate()} required value={tourDate} onChange={(e) => setTourDate(e.target.value)} disabled={availabilityLoading}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      />
                      {availabilityLoading && <p className="mt-1 text-xs text-slate-500">Checking available dates...</p>}
                      {!availabilityLoading && tourDate && bookedDates.includes(tourDate) && <p className="mt-1 text-xs text-red-600">This date is already booked.</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                      pattern="(?:\+63|0)9[0-9]{9}" maxLength={13} title="Enter a Philippine mobile number, such as 09171234567 or +639171234567."
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      placeholder="09171234567 or +639171234567"
                    />
                  </div>
                </form>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setSelectedTour(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-lg font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" form="booking-form" disabled={availabilityLoading || bookedDates.includes(tourDate)} className="flex-1 bg-[#ce9136] hover:bg-[#b87d2b] text-white py-3 rounded-lg font-bold transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
                  Confirm & Pay
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  )
}