"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { SiteShell } from "@/components/site-shell"

type BookingDetails = {
  userId: string | null
  packageId: number | string
  tourPackage: string
  leadGuestName: string
  pax: number
  tourDate: string
  contactNumber: string
  totalAmount: number
}

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [booking, setBooking] = useState<BookingDetails | null>(null)

  useEffect(() => {
    toast.dismiss()
    const savedBooking = sessionStorage.getItem("jazgot-booking")
    if (!savedBooking) {
      toast.error("No booking details found. Please select a tour package first.")
      return
    }

    try {
      const parsedBooking = JSON.parse(savedBooking) as BookingDetails
      queueMicrotask(() => setBooking(parsedBooking))
    } catch {
      toast.error("Your booking details could not be loaded. Please select a tour package again.")
    }
  }, [])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking) return
    setIsProcessing(true)
    toast.loading("Connecting to Paymongo Secure Checkout...")

    try {
      // Send data to your new backend API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          origin: window.location.origin 
        })
      })

      const data = await response.json()

      if (data.url) {
        toast.dismiss()
        // This physically redirects the browser to Paymongo's checkout screen
        window.location.href = data.url 
      } else {
        throw new Error(data.error || "Failed to generate checkout link")
      }
    } catch (error) {
      console.error(error)
      toast.dismiss()
      toast.error("Could not connect to payment gateway. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <SiteShell>
      <div className="min-h-[70vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* Order Summary Sidebar */}
          <div className="bg-slate-900 text-white p-8 md:w-1/3 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              {booking ? <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Tour Package</p>
                  <p className="font-medium text-white">{booking.tourPackage}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Guests</p>
                  <p className="font-medium text-white">{booking.pax} Pax</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Date</p>
                  <p className="font-medium text-white">{new Date(`${booking.tourDate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div> : <p className="text-sm text-slate-300">No booking selected.</p>}
            </div>
            <div className="mt-8 border-t border-slate-700 pt-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-[#ce9136]">{booking ? `₱${booking.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "--"}</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-8 md:w-2/3">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Details</h2>
            
            <form onSubmit={handlePayment} className="space-y-5">
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Payment via Paymongo</h3>
                <p className="text-sm text-slate-600 mb-4">
                  To ensure your security, we do not store your credit card information. You will be redirected to Paymongo&apos;s encrypted checkout gateway to complete your purchase.
                </p>
                
                <div className="flex justify-center gap-3 text-xs font-medium text-slate-500">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">Credit / Debit Card</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">GCash</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">Maya</span>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isProcessing || !booking}
                className="w-full bg-[#ce9136] hover:bg-[#b87d2b] text-white py-4 rounded-lg font-bold transition-colors mt-6 disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-sm"
              >
                {isProcessing ? "Connecting to Paymongo..." : "Proceed to Secure Payment"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </SiteShell>
  )
}