"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'

interface InvoiceRecord {
  id: string
  invoice_no: string
  client_name: string
  total_amount: number
  date_paid: string
  status: string
  tour_package: string
  contact_number?: string
  pax?: number
  tour_date?: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real paid invoices from the Supabase 'invoices' table on load
  useEffect(() => {
    async function fetchInvoices() {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('date_paid', { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
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

    const headers = ["Invoice Number", "Client Name", "Tour Package", "Total Paid (PHP)", "Date Paid", "Status"]
    const rows = invoices.map(inv => [
      inv.invoice_no,
      `"${inv.client_name}"`,
      `"${inv.tour_package || 'Tour Package'}"`,
      inv.total_amount,
      inv.date_paid,
      inv.status
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
  const handleViewPDF = (invoice: InvoiceRecord) => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text("JAZGOT TOUR SERVICES", 20, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("El Nido, Palawan, Philippines", 20, 26)

    doc.line(20, 32, 190, 32)

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Official Invoice: ${invoice.invoice_no}`, 20, 42)
    doc.setFont("helvetica", "normal")
    doc.text(`Date Paid: ${invoice.date_paid}`, 20, 50)

    doc.text(`Client Name: ${invoice.client_name}`, 20, 62)
    doc.text(`Contact Number: ${invoice.contact_number || 'N/A'}`, 20, 70)
    doc.text(`Tour Package: ${invoice.tour_package || 'N/A'}`, 20, 78)
    doc.text(`Guests (Pax): ${invoice.pax || 1}`, 20, 86)
    doc.text(`Tour Date: ${invoice.tour_date || 'N/A'}`, 20, 94)

    doc.line(20, 102, 190, 102)
    doc.setFont("helvetica", "bold")
    doc.text(`Total Paid: PHP ${invoice.total_amount.toLocaleString()}.00`, 20, 112)

    doc.save(`${invoice.invoice_no}.pdf`)
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
                  <td className="p-4 font-bold text-slate-900">{invoice.invoice_no}</td>
                  <td className="p-4 text-slate-700">{invoice.client_name}</td>
                  <td className="p-4 font-semibold text-emerald-600">₱{invoice.total_amount.toLocaleString()}</td>
                  <td className="p-4 text-slate-500 text-sm">{invoice.date_paid}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      {invoice.status}
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