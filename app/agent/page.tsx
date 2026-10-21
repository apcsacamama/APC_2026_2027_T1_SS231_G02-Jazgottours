'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiArrowRight, 
  FiTrendingUp, 
  FiPackage,
  FiUser
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { 
  getActiveAgent, 
  syncActiveAgentFromUser,
  getStoredAgentBookings, 
  AgentBooking, 
  AgentProfile 
} from '@/lib/agent-service';

export default function AgentDashboardPage() {
  const [agent, setAgent] = useState<AgentProfile>(() => getActiveAgent());
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let curAgent = getActiveAgent();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        curAgent = syncActiveAgentFromUser(session.user);
      }
      setAgent(curAgent);

      const allBookings = getStoredAgentBookings();
      const myBookings = allBookings.filter((b) => 
        b.agent_email?.toLowerCase() === curAgent.email?.toLowerCase() || 
        b.agent_id === curAgent.id || 
        b.agent_name?.toLowerCase() === curAgent.name?.toLowerCase()
      );
      setBookings(myBookings);
      setLoading(false);
    };

    loadData();
  }, []);

  const totalBookings = bookings.length;
  const totalMarkupProfit = bookings.reduce((sum, b) => sum + (b.agent_earnings || 0), 0);
  const pendingApprovals = bookings.filter((b) => b.status === 'Pending').length;
  const adminCommissionGenerated = bookings.reduce((sum, b) => sum + (b.admin_commission || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-900">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
              Agent Partner • {agent.code}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 capitalize">Welcome Back, {agent.name}!</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Manage your mark-up profits and track Admin confirmations in real time.
          </p>
        </div>
      </div>

      {/* Action Banner: Mark-up & Confidentiality Notice */}
      <div className="bg-gradient-to-r from-amber-100/80 via-white to-amber-50 border border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <span>🛡️</span> Admin Pricing Protocol Active
          </p>
          <p className="text-[11px] text-slate-600">
            Tour original cost is strictly confidential and managed by Admin. You can customize your selling mark-up on every tour.
          </p>
        </div>
        <Link
          href="/agent/products"
          className="text-xs font-bold text-[#b8731b] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Adjust My Mark-ups</span> <FiArrowRight size={13} />
        </Link>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">My Bookings</span>
            <h2 className="text-2xl font-extrabold text-gray-900">{totalBookings}</h2>
            <p className="text-[10px] text-slate-400">Clients booked under you</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60">
            <FiCalendar size={20} />
          </div>
        </div>

        {/* Total Markup Profit */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">My Markup Profit</span>
            <h2 className="text-2xl font-extrabold text-emerald-600">₱{totalMarkupProfit.toLocaleString()}</h2>
            <p className="text-[10px] text-emerald-700">Net markup earnings</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/60">
            <FiTrendingUp size={20} />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pending Approval</span>
            <h2 className="text-2xl font-extrabold text-amber-600">{pendingApprovals}</h2>
            <p className="text-[10px] text-amber-700">Awaiting Admin approval</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
            <FiClock size={20} />
          </div>
        </div>

        {/* Admin 5% Commission Contributed */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Admin 5% Cut</span>
            <h2 className="text-2xl font-extrabold text-slate-900">₱{adminCommissionGenerated.toLocaleString()}</h2>
            <p className="text-[10px] text-slate-400">Generated for Jasmine</p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-bold text-base flex items-center justify-center w-[42px] h-[42px]">
            ₱
          </div>
        </div>
      </div>

      {/* Recent Client Bookings Table */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-amber-100 flex justify-between items-center bg-[#fcfbf9]/60">
          <div className="flex items-center gap-2">
            <FiPackage className="text-[#c89134]" size={18} />
            <h3 className="font-bold text-gray-900 text-sm">Recent Clients Booked Under Your Name</h3>
          </div>
          <Link href="/agent/bookings" className="text-xs font-semibold text-[#c89134] hover:underline">
            View all bookings →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-5">Client Name</th>
                <th className="py-3 px-5">Tour Package</th>
                <th className="py-3 px-5">Travel Date</th>
                <th className="py-3 px-5">Pax</th>
                <th className="py-3 px-5">Client Total</th>
                <th className="py-3 px-5">Your Markup</th>
                <th className="py-3 px-5">Admin Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Loading your bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <p>No client bookings recorded under your name yet.</p>
                    <p className="text-[11px] mt-1 text-amber-700">Clients can book directly and enter your referral code.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                          <FiUser size={11} />
                        </div>
                        <div>
                          <p>{b.client_name}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{b.client_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-gray-700 font-medium">{b.tour_package}</td>
                    <td className="py-3.5 px-5 text-gray-500">
                      {new Date(b.tour_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-gray-800">{b.pax} Guests</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">₱{b.total_amount.toLocaleString()}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600">
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
                        {b.status === 'Confirmed' ? 'Confirmed by Admin' : 'Pending Confirmation'}
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
