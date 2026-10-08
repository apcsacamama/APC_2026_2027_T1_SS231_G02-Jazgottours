'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function QuotationRecordsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  async function fetchQuotations() {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans text-gray-900 bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">Database Log</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Quotation Records</h1>
          <p className="text-xs text-gray-500 mt-1">Track all historical quotations saved via the AI parser or manual form.</p>
        </div>
        {/* Clicking this button navigates to the dedicated AI parser & form creation page */}
        <Link
          href="/admin/quotation/create"
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          + New AI Quotation
        </Link>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          Error loading quotation records: {error.message}
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Loading records...</div>
      ) : !quotations || quotations.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
          No quotation records found in the database.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Reference No</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact / Email</th>
                <th className="py-3.5 px-4">Pax</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.map((q) => (
                <tr key={q.reference_no || q.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-blue-600">
                    <Link href={`/admin/quotation/${q.reference_no}`} className="hover:underline">
                      {q.reference_no}
                    </Link>
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">{q.client_name}</td>
                  <td className="py-4 px-4 text-gray-600">
                    <span className="block">{q.client_email}</span>
                    <span className="text-[11px] text-gray-400">{q.client_contact}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    <span className="block">{q.duration}</span>
                    <span className="font-semibold text-gray-900">{q.pax}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-900">₱{Number(q.total_amount || 0).toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-500">
                    {q.created_at ? new Date(q.created_at).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}