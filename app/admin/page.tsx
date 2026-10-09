'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiFileText, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

export default function AdminHomePage() {
  const [quotationCount, setQuotationCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Quotations Count (adjust table name if needed, e.g. 'quotations')
      const { count: quotCount, error: quotError } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true });
      
      if (!quotError && quotCount !== null) {
        setQuotationCount(quotCount);
      }

      // 2. Fetch Invoices Count (adjust table name if needed, e.g. 'invoices')
      const { count: invCount, error: invError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      if (!invError && invCount !== null) {
        setInvoiceCount(invCount);
      }

      // 3. Fetch Recent Bookings (Max 5, ordered by newest first)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!bookingsError && bookingsData) {
        setRecentBookings(bookingsData);
      } else {
        // Fallback dummy data if table is empty or not yet seeded
        setRecentBookings([
          { id: 1, client_name: 'Maria Santos', tour_name: 'Coron Island Escape', date: 'Aug 27, 2026', total_amount: '₱4,500', status: 'Pending' },
          { id: 2, client_name: 'Juan Dela Cruz', tour_name: 'Batanes Heritage Tour', date: 'Aug 26, 2026', total_amount: '₱7,200', status: 'Confirmed' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 p-6">
      {/* Top Header Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Owner & Sales Workspace</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Welcome Back, Jasmine!</h1>
          <p className="text-sm text-gray-600">Here is the quick overview of your sales and marketing activities.</p>
        </div>
      </div>

      {/* Stats Cards Row (2 Columns now that client contacts are removed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Quotations Made */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quotations Made</span>
            <h2 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : quotationCount}</h2>
            <Link href="/admin/quotation/records" className="inline-flex items-center gap-1 text-xs font-semibold text-[#c89134] hover:underline pt-2">
              View quotations <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="p-3 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60">
            <FiFileText size={22} />
          </div>
        </div>

        {/* Card 2: Invoices Made */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Invoices Made</span>
            <h2 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : invoiceCount}</h2>
            <Link href="/admin/invoices" className="inline-flex items-center gap-1 text-xs font-semibold text-[#c89134] hover:underline pt-2">
              View invoices <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="p-3 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60 font-bold text-xl flex items-center justify-center w-[46px] h-[46px]">
            ₱
          </div>
        </div>
      </div>

      {/* Recent Bookings Table Card (Replaced Quotations) */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-amber-100 flex justify-between items-center bg-[#fcfbf9]/50">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-[#c89134]" size={18} />
            <h3 className="font-bold text-gray-900 text-base">Recent Bookings</h3>
          </div>
          <Link href="/admin/bookings" className="text-xs font-semibold text-[#c89134] hover:underline">
            Manage all bookings
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-6">Client Name</th>
                <th className="py-3 px-6">Tour / Service</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Total Amount</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                    No recent bookings found.
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking, idx) => (
                  <tr key={booking.id || idx} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900">{booking.client_name || booking.client || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600">{booking.tour_name || booking.service || 'Tour Booking'}</td>
                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : booking.date}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{booking.total_amount || booking.amount || '₱0'}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'Pending'
                            ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {booking.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}