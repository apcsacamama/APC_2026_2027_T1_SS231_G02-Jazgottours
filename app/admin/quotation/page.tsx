'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Quotation {
  id: string;
  reference_no: string;
  client_name: string;
  client_email: string;
  client_contact: string;
  package_name: string;
  pax: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function QuotationRecordsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (err: any) {
      console.error('Error fetching quotations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalQuotations = quotations.length;
  const pendingDraftsCount = quotations.filter(
    (q) => q.status === 'Draft' || q.status === 'Pending' || !q.status
  ).length;
  const convertedCount = quotations.filter(
    (q) => q.status === 'Converted' || q.status === 'Confirmed'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans text-slate-900 bg-white space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Command Center
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Quotation Records</h1>
          <p className="text-sm text-slate-600">Monitor historical inquiries, track pipeline status, and manage client bookings.</p>
        </div>
        <Link
          href="/admin/quotation/create"
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>+ New AI Quotation</span>
        </Link>
      </div>

      {/* KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Quotations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Quotations</p>
          <h3 className="text-3xl font-extrabold text-slate-900">{totalQuotations}</h3>
          <p className="text-[11px] text-slate-400">All-time logged client requests</p>
        </div>

        {/* Pending / Drafts */}
        <div className="bg-amber-50/55 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Pending / Drafts</p>
          <h3 className="text-3xl font-extrabold text-amber-900">{pendingDraftsCount}</h3>
          <p className="text-[11px] text-amber-700/80">Number of quotes awaiting client follow-up or final confirmation.</p>
        </div>

        {/* Converted Bookings */}
        <div className="bg-emerald-50/55 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Converted Bookings</p>
          <h3 className="text-3xl font-extrabold text-emerald-900">{convertedCount}</h3>
          <p className="text-[11px] text-emerald-700/80">Quotations that successfully transitioned into confirmed tours.</p>
        </div>
      </div>

      {/* Database Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Historical Log Database</h3>
          <span className="text-xs text-slate-500">{quotations.length} records found</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading quotation logs...</div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-500">No quotation records found in Supabase.</p>
            <Link
              href="/admin/quotation/create"
              className="inline-block text-xs font-semibold text-amber-600 hover:underline"
            >
              Create your first quotation →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Reference No</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Pax</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id || q.reference_no} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-semibold text-amber-700">{q.reference_no}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{q.client_name}</div>
                      <div className="text-slate-400 text-[11px]">{q.client_email}</div>
                    </td>
                    <td className="p-4 text-slate-700 max-w-xs truncate">{q.package_name}</td>
                    <td className="p-4 text-slate-700">{q.pax} Pax</td>
                    <td className="p-4 font-semibold text-slate-900">
                      ₱{q.total_amount?.toLocaleString() ?? '0'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'Converted' || q.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {q.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(q.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}