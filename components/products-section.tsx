"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProductCard } from "@/components/product-card"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
// Remove the static import: import { tours } from "@/lib/tours"

// Import the action we created earlier
import { getPackages } from "@/lib/actions/packages"

export function ProductsSection() {
  const router = useRouter()
  const { user } = useAuth()

  // --- NEW: Live Packages State ---
  const [livePackages, setLivePackages] = useState<any[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

  // Auth Modals
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Tour Selection
  const [selectedTour, setSelectedTour] = useState<any>(null)
  const [pendingTour, setPendingTour] = useState<any>(null) 

  // Auth Form Inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clientName, setClientName] = useState("")
  
  // Booking Form Inputs
  const [guestName, setGuestName] = useState("")
  const [pax, setPax] = useState<number | "">(1)
  const [tourDate, setTourDate] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  
  // Add-ons State
  const [includeEtdf, setIncludeEtdf] = useState(false)
  const [includeLagoon, setIncludeLagoon] = useState(false)

  // --- NEW: Fetch Packages on Load ---
  useEffect(() => {
    const fetchLiveTours = async () => {
      try {
        const data = await getPackages()
        setLivePackages(data || [])
      } catch (err) {
        console.error("Failed to load tour packages:", err)
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchLiveTours()
  }, [])

  // --- DYNAMIC PRICE CALCULATION ---
  const currentPax = typeof pax === "number" && pax > 0 ? pax : 1
  const basePrice = selectedTour?.price || 1350
  const addonsPrice = (includeEtdf ? 400 : 0) + (includeLagoon ? 200 : 0)
  const totalAmount = (basePrice + addonsPrice) * currentPax

  // --- LOGIC HANDLERS ---
  const handleTourClick = (tour: any) => {
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
    toast.loading("Processing your booking details...")
    
    // Route to checkout
    router.push("/checkout")
    
    // Reset form
    setSelectedTour(null)
    setGuestName("")
    setPax(1)
    setTourDate("")
    setContactNumber("")
    setIncludeEtdf(false)
    setIncludeLagoon(false)
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
              {/* Ensure ProductCard can read your Supabase column names */}
              <ProductCard tour={{
                id: tour.id,
                title: tour.title,
                description: tour.description,              
                price: tour.price,
                originalPrice: tour.original_price,
                destinations: tour.destinations,
                image: tour.image              
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

      {/* 2. BOOKING MODAL WITH ADD-ONS */}
      {user && selectedTour && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl overflow-y-auto md:overflow-hidden max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row">
            
            {/* LEFT COLUMN: Tour Details */}
            <div className="md:w-1/2 bg-white md:overflow-y-auto flex flex-col">
              <div className="h-48 md:h-64 lg:h-72 w-full relative shrink-0">
                <img 
                  src={selectedTour.image || selectedTour.imageUrl || "/placeholder-tour.jpg"} 
                  alt={selectedTour.title || selectedTour.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 right-4 text-2xl font-bold text-white drop-shadow-md">
                  {selectedTour.title || selectedTour.name}
                </h3>
              </div>
              
              <div className="p-6 text-sm text-slate-600 space-y-5">
                <p>
                  {selectedTour.description || "Experience Island Hopping in El Nido with the most Famous Islands and Adventure. (08:30am to 04:30pm), you can do Island Tours, Snorkeling, Swimming, Sightseeing in the Beaches, and kayaking."}
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1">Destinations:</h4>
                  <ul className="space-y-2 text-xs">
                    <li><strong className="text-slate-800">Big Lagoon</strong> kayaking activity that you can go around 800meters to 1 kilometer inside to see the clear water of the Lagoon</li>
                    <li><strong className="text-slate-800">Secret Lagoon</strong> there's a small entrance to go inside and you can see the beautiful rock formations that looks like crocodile head, eagle head and more..</li>
                    <li><strong className="text-slate-800">Snorkeling spot</strong> where you will see the crystal view of the corals and a lot of fishes</li>
                    <li><strong className="text-slate-800">Shimizu Island</strong> a clear water beach that you will eat your lunch and do for snorkeling along the shores</li>
                    <li><strong className="text-slate-800">Seven Commandos Beach</strong> a clean white sand beach that you relax, play volleyball, sunbathing, snorkeling, swimming, buy beers to drink and eat some snacks.</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-2">Inclusions:</h4>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-emerald-700">
                    <li>Buffet Lunch</li>
                    <li>License Tour Guide</li>
                    <li>Boat Transfer</li>
                    <li>Drinking Water</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Booking Form & Add-ons */}
            <div className="md:w-1/2 bg-slate-50 p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 shrink-0 md:overflow-y-auto">
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Secure your slot</h3>
                    <p className="text-slate-500 text-xs mt-1">Book at least 24-48hrs before tour date.</p>
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
                        type="number" min="1" required value={pax} onChange={(e) => setPax(parseInt(e.target.value))} 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tour Date</label>
                      <input 
                        type="date" required value={tourDate} onChange={(e) => setTourDate(e.target.value)} 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} 
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#ce9136] text-slate-900 outline-none" 
                      placeholder="+63 900 000 0000"
                    />
                  </div>

                  {/* ADD-ONS SECTION */}
                  <div className="pt-4 border-t border-slate-200 mt-6">
                    <label className="block text-sm font-bold text-slate-800 mb-3">Optional Add-ons (Per Pax)</label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={includeEtdf} 
                          onChange={(e) => setIncludeEtdf(e.target.checked)} 
                          className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" 
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-bold text-slate-900">El Nido ETDF</p>
                          <p className="text-slate-500 text-xs mt-0.5">Eco Tourism Development Fee - Valid for 10 days for El Nido Tour Activities</p>
                        </div>
                        <span className="font-bold text-slate-700 whitespace-nowrap">+ ₱400</span>
                      </label>

                      <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={includeLagoon} 
                          onChange={(e) => setIncludeLagoon(e.target.checked)} 
                          className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" 
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-bold text-slate-900">Lagoon Entrance Fee</p>
                          <p className="text-slate-500 text-xs mt-0.5">Required entrance fee for El Nido Island Tour A</p>
                        </div>
                        <span className="font-bold text-slate-700 whitespace-nowrap">+ ₱200</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setSelectedTour(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-lg font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" form="booking-form" className="flex-1 bg-[#ce9136] hover:bg-[#b87d2b] text-white py-3 rounded-lg font-bold transition-colors shadow-sm">
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