"use client"

import React, { useState, useEffect, useRef } from "react"
import { SiteShell } from "@/components/site-shell"
import { supabase } from "@/lib/supabase"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { toast } from "sonner"

interface BookingDetails {
  id: string
  invoice_number?: string
  tour_package: string
  lead_guest_name: string
  pax: number
  tour_date: string
  contact_number: string
  total_amount: number
  payment_status: string
  date_paid?: string
}

export default function DashboardPage() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Fetch the latest booking from Supabase to show real-time details
  useEffect(() => {
    async function fetchLatestBooking() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error fetching booking:", error)
        toast.error("Failed to load your booking details.")
      } else if (data && data.length > 0) {
        setBooking(data[0])
      }
      setLoading(false)
    }

    fetchLatestBooking()
  }, [])

  const handleDownloadPDF = () => {
    if (!booking) return

    // Save the loading toast ID so we can dismiss it explicitly
    const toastId = toast.loading("Generating your invoice...")

    try {
      const doc = new jsPDF()

      // Set font styling
      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.text("JAZGOT TOUR SERVICES", 20, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("El Nido, Palawan, Philippines", 20, 26)

      // Divider line
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 32, 190, 32)

      // Invoice Meta
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("OFFICIAL INVOICE / BOOKING RECEIPT", 20, 42)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Booking Ref: #${booking.invoice_number || booking.id.slice(0, 8)}`, 20, 50)
      doc.text(`Status: CONFIRMED & PAID`, 20, 56)
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50)

      // Table Header Box
      doc.setFillColor(245, 247, 250)
      doc.rect(20, 66, 170, 10, "F")
      doc.setFont("helvetica", "bold")
      doc.text("Description", 24, 73)
      doc.text("Details", 120, 73)

      // Content Rows
      doc.setFont("helvetica", "normal")
      let startY = 86
      const rows = [
        ["Tour Package", booking.tour_package],
        ["Lead Guest", booking.lead_guest_name],
        ["Contact Number", booking.contact_number],
        ["Number of Guests (Pax)", String(booking.pax)],
        ["Tour Date", booking.tour_date],
        ["Payment Method", "PayMongo (Online)"]
      ]

      rows.forEach(([label, value]) => {
        doc.text(label, 24, startY)
        doc.text(value, 120, startY)
        startY += 8
      })

      // Total Line
      doc.line(20, startY + 4, 190, startY + 4)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Total Paid:", 24, startY + 14)
      doc.text(`PHP ${booking.total_amount.toLocaleString()}.00`, 120, startY + 14)

      // Footer
      doc.setFont("helvetica", "italic")
      doc.setFontSize(8)
      doc.text("Thank you for booking with Jazgot Tour Services!", 20, startY + 30)

      // Save the PDF
      doc.save(`JazGot_Invoice_${booking.invoice_number || booking.id.slice(0, 6)}.pdf`)

      // Dismiss the loading toast and show success
      toast.dismiss(toastId)
      toast.success("Invoice downloaded successfully!")
    } catch (error) {
      console.error("PDF Generation Error:", error)
      toast.dismiss(toastId)
      toast.error("Failed to generate PDF.")
    }
  }

  return (
    <SiteShell>
      <div className="min-h-[70vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your bookings and invoices.</p>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
              Loading your booking information...
            </div>
          ) : !booking ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
              No recent bookings found.
            </div>
          ) : (
            <div 
              id="invoice-card-container" 
              ref={invoiceRef} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Card Header */}
              <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-3">
                    {booking.payment_status === 'paid' ? 'PAID' : 'PENDING PAYMENT'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{booking.tour_package}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Booking Ref: #{booking.invoice_number || booking.id.slice(0, 8)}
                  </p>
                </div>

                <div className="mt-4 md:mt-0 text-left md:text-right flex items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Paid</p>
                    <p className="text-xl font-bold text-[#ce9136]">₱{booking.total_amount.toLocaleString()}</p>
                  </div>
                  <div data-html2canvas-ignore className="text-slate-400 bg-slate-100 h-8 w-8 rounded-full flex items-center justify-center">
                    {isExpanded ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 mb-4">Invoice & Itinerary Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    {/* Left: Customer Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Lead Guest</p>
                        <p className="font-medium text-slate-900">{booking.lead_guest_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Pax & Date</p>
                        <p className="font-medium text-slate-900">{booking.pax} Guest(s) • {booking.tour_date}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Contact</p>
                        <p className="font-medium text-slate-900">{booking.contact_number}</p>
                      </div>
                    </div>

                    {/* Right: Payment & Status Info */}
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Payment Status</p>
                      <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                        <p className="text-slate-700 font-medium">Successfully Processed via Paymongo</p>
                        <p className="text-xs text-slate-500">
                          Synced to Admin Invoices automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div data-html2canvas-ignore className="mt-8 pt-6 border-t border-slate-200 flex gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadPDF()
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm cursor-pointer"
                    >
                      Download PDF Invoice
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  )
}