'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiCalendar, 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiClock, 
  FiEye, 
  FiUser, 
  FiMapPin, 
  FiPlusCircle,
  FiTrendingUp,
  FiShield
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { 
  getActiveAgent, 
  syncActiveAgentFromUser,
  getStoredAgentBookings, 
  AgentBooking, 
  AgentProfile 
} from '@/lib/agent-service';

export default function AgentBookingsPage() {
  const [agent, setAgent] = useState<AgentProfile>(() => getActiveAgent());
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<AgentBooking | null>(null);

  useEffect(() => {
    const init = async () => {
      let curAgent = getActiveAgent();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        curAgent = syncActiveAgentFromUser(session.user);
      }
      setAgent(curAgent);
      const all = getStoredAgentBookings();
      const myBookings = all.filter((b) => 
        b.agent_email?.toLowerCase() === curAgent.email?.toLowerCase() || 
        b.agent_id === curAgent.id || 
        b.agent_name?.toLowerCase() === curAgent.name?.toLowerCase()
      );
      setBookings(myBookings);
    };

    init();
  }, []);

  const filtered = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      b.client_name.toLowerCase().includes(query) ||
      b.tour_package.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      b.client_email.toLowerCase().includes(query);

    const matchesStatus = 
      statusFilter === 'all' || b.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans text-slate-900 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-amber-200/60 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
            Agent Portfolio • {agent.code}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">My Client Bookings</h1>
          <p className="text-xs text-slate-600">
            Review status updates and confirmation receipts for bookings submitted under {agent.name}.
          </p>
        </div>

        <Link
          href="/agent/book"
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <FiPlusCircle size={15} />
          <span>New Client Booking</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search client name, tour, booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <FiFilter size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending Admin Approval</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-amber-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 flex justify-between items-center bg-[#fcfbf9]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Booking Records ({filtered.length})
          </h3>
          <span className="text-xs text-emerald-700 font-bold">
            Total Markup Earned: ₱{filtered.reduce((s, b) => s + b.agent_earnings, 0).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-5">Booking Ref</th>
                <th className="py-3.5 px-5">Client Name</th>
                <th className="py-3.5 px-5">Tour Package</th>
                <th className="py-3.5 px-5">Travel Date</th>
                <th className="py-3.5 px-5">Pax</th>
                <th className="py-3.5 px-5">Total Price</th>
                <th className="py-3.5 px-5">Your Markup</th>
                <th className="py-3.5 px-5">Admin Status</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] font-bold text-slate-700">
                      #{b.id}
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px]">
                          <FiUser size={11} />
                        </div>
                        <div>
                          <p>{b.client_name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{b.client_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-medium text-slate-700">
                      <div className="flex items-center gap-1">
                        <FiMapPin size={11} className="text-amber-700" />
                        <span>{b.tour_package}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(b.tour_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-5 font-semibold text-slate-700">{b.pax} Guests</td>

                    <td className="py-3.5 px-5 font-extrabold text-slate-900">
                      ₱{b.total_amount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-5 font-extrabold text-emerald-600">
                      +₱{b.agent_earnings.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {b.status === 'Confirmed' ? <FiCheckCircle size={10} /> : <FiClock size={10} />}
                        {b.status === 'Confirmed' ? 'Confirmed by Admin' : 'Pending Admin Confirmation'}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="text-amber-800 hover:text-amber-950 font-bold p-1 rounded-lg hover:bg-amber-100/60 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FiEye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Ref: #{selectedBooking.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Client Booking Overview</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Lead Client</span>
                <p className="font-bold text-slate-900">{selectedBooking.client_name}</p>
                <p className="text-[11px] text-slate-500">{selectedBooking.client_email}</p>
                <p className="text-[11px] text-slate-500">{selectedBooking.client_phone}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tour & Date</span>
                <p className="font-bold text-slate-900">{selectedBooking.tour_package}</p>
                <p className="text-[11px] text-amber-800 font-semibold">{selectedBooking.pax} Guests</p>
                <p className="text-[11px] text-slate-500">{new Date(selectedBooking.tour_date).toDateString()}</p>
              </div>
            </div>

            {/* Split Details */}
            <div className="bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Client Selling Price:</span>
                <span className="font-extrabold text-sm text-slate-900">
                  ₱{selectedBooking.total_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 font-bold">
                <span className="flex items-center gap-1">
                  <FiTrendingUp size={12} /> Your Mark-up Profit:
                </span>
                <span>₱{selectedBooking.agent_earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-amber-900 font-bold pt-1 border-t border-amber-200/60">
                <span className="flex items-center gap-1">
                  <FiShield size={12} /> Admin 5% Commission:
                </span>
                <span>₱{selectedBooking.admin_commission.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-600">Admin Approval Status:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                  selectedBooking.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedBooking.status === 'Confirmed' ? 'Confirmed & Synced' : 'Pending Admin Confirmation'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
