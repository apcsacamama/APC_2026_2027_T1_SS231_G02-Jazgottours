"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface BookingInvoice {
  id: string
  invoice_number?: string
  lead_guest_name: string
  total_amount: number
  date_paid?: string
  payment_status: string
  tour_package: string
  contact_number?: string
  pax?: number
  tour_date?: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<BookingInvoice[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real paid bookings from Supabase on load
  useEffect(() => {
    async function fetchInvoices() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching paid invoices:", error)
      } else {
        setInvoices(data || [])
      }
      setLoading(false)
    }

    fetchInvoices()
  }, [])

  // Export all visible invoices to CSV
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert("No invoices to export.")
      return
    }

    const headers = ["Invoice Number", "Client Name", "Total Paid (PHP)", "Date Paid", "Status"]
    const rows = invoices.map(inv => [
      inv.invoice_number || `INV-${inv.id.slice(0, 6)}`,
      `"${inv.lead_guest_name}"`,
      inv.total_amount,
      inv.date_paid || "Recent",
      inv.payment_status
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Jazgot_Paid_Invoices_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate and download a PDF for a specific invoice row
  const handleViewPDF = (invoice: BookingInvoice) => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text("JAZGOT TOUR SERVICES", 20, 20)
    
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Official Invoice: ${invoice.invoice_number || `INV-${invoice.id.slice(0, 6)}`}`, 20, 30)
    doc.text(`Date Paid: ${invoice.date_paid || 'Recent'}`, 20, 38)

    doc.line(20, 45, 190, 45)

    doc.text(`Client Name: ${invoice.lead_guest_name}`, 20, 55)
    doc.text(`Contact Number: ${invoice.contact_number || 'N/A'}`, 20, 63)
    doc.text(`Tour Package: ${invoice.tour_package}`, 20, 71)
    doc.text(`Guests (Pax): ${invoice.pax || 1}`, 20, 79)
    doc.text(`Tour Date: ${invoice.tour_date || 'N/A'}`, 20, 87)

    doc.line(20, 95, 190, 95)
    doc.setFont("helvetica", "bold")
    doc.text(`Total Paid: PHP ${invoice.total_amount.toLocaleString()}`, 20, 105)

    doc.save(`${invoice.invoice_number || 'Jazgot_Invoice'}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paid Invoices</h1>
          <p className="text-slate-500">Track confirmed bookings automatically synced via Paymongo.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
        >
          Export Report (CSV)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Invoice Number</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Client Name</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Total Paid (PHP)</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Date Paid</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">Loading real-time invoices...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">No paid invoices found yet.</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {invoice.invoice_number || `INV-${invoice.id.slice(0, 6)}`}
                  </td>
                  <td className="p-4 text-slate-700">{invoice.lead_guest_name}</td>
                  <td className="p-4 font-semibold text-emerald-600">₱{invoice.total_amount.toLocaleString()}</td>
                  <td className="p-4 text-slate-500 text-sm">{invoice.date_paid || 'Recent'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Confirmed Booking
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleViewPDF(invoice)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4 cursor-pointer"
                    >
                      View PDF
                    </button>
                    <button className="text-slate-500 hover:text-slate-700 text-sm font-medium">Forward to Acctg</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}