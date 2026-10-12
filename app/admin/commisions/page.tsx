"use client"

import { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiUsers, 
  FiCheckCircle, 
  FiClock, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiBell,
  FiLock,
  FiShield,
  FiPackage,
  FiGlobe,
  FiCheck,
  FiRefreshCw
} from 'react-icons/fi';
import {
  getStoredAgentBookings,
  updateAgentBookingStatus,
  getAdminCommissionNotifications,
  dismissAdminCommissionNotification,
  type AgentBooking,
  type AdminCommissionNotification
} from '@/lib/agent-service';
import { supabase } from '@/lib/supabase';
import { getPackages, updatePackageOriginalPrice } from '@/lib/actions/packages';

const DEFAULT_COMMISSION_RATE = 5; // %
const COMMISSION_RATE_KEY = 'jazgot_admin_commission_rate';

function getCommissionRate(): number {
  if (typeof window === 'undefined') return DEFAULT_COMMISSION_RATE;
  const stored = localStorage.getItem(COMMISSION_RATE_KEY);
  return stored ? parseFloat(stored) : DEFAULT_COMMISSION_RATE;
}

function saveCommissionRate(rate: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMMISSION_RATE_KEY, String(rate));
}

interface DirectBooking {
  id: number | string;
  lead_guest_name: string;
  email: string;
  contact_number?: string;
  tour_package: string;
  pax: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface TourPackageItem {
  id: number;
  title: string;
  price: number;
  original_price: number;
  destinations?: number;
}

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<'agents' | 'direct' | 'pricing'>('agents');
  
  // Agent bookings
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  
  // Direct bookings from Supabase
  const [directBookings, setDirectBookings] = useState<DirectBooking[]>([]);
  const [loadingDirect, setLoadingDirect] = useState(true);

  // Packages for Original Price editing
  const [packages, setPackages] = useState<TourPackageItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [editingOriginalPrices, setEditingOriginalPrices] = useState<Record<number, number>>({});
  const [savingPackageId, setSavingPackageId] = useState<number | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<number | null>(null);

  // Commission Rate
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);
  const [editingRate, setEditingRate] = useState(false);
  const [draftRate, setDraftRate] = useState(DEFAULT_COMMISSION_RATE);

  // Notifications
  const [notifications, setNotifications] = useState<AdminCommissionNotification[]>([]);

  useEffect(() => {
    const rate = getCommissionRate();
    setCommissionRate(rate);
    setDraftRate(rate);

    // 1. Load agent bookings
    setBookings(getStoredAgentBookings());

    // 2. Load notifications
    setNotifications(getAdminCommissionNotifications());

    // 3. Load direct bookings from Supabase
    fetchDirectBookings();

    // 4. Load packages for original price editor
    fetchPackagesList();
  }, []);

  const fetchDirectBookings = async () => {
    setLoadingDirect(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter out agent bookings (they have "(via Agent:" in lead_guest_name)
        const direct = data.filter((b: any) => !b.lead_guest_name?.includes('(via Agent:'));
        setDirectBookings(direct);
      }
    } catch (err) {
      console.error('Error fetching direct bookings:', err);
    } finally {
      setLoadingDirect(false);
    }
  };

  const fetchPackagesList = async () => {
    setLoadingPackages(true);
    try {
      const data = await getPackages();
      if (data) {
        setPackages(data as TourPackageItem[]);
        const initialPrices: Record<number, number> = {};
        data.forEach((p: any) => {
          initialPrices[p.id] = p.original_price ?? 0;
        });
        setEditingOriginalPrices(initialPrices);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Agent bookings calculations
  const confirmedAgentBookings = bookings.filter(b => b.status === 'Confirmed');
  const pendingAgentBookings = bookings.filter(b => b.status === 'Pending');
  const totalAgentCommission = confirmedAgentBookings.reduce(
    (sum, b) => sum + Math.round(b.total_amount * (commissionRate / 100)), 
    0
  );
  const totalAgentEarnings = confirmedAgentBookings.reduce((sum, b) => sum + b.agent_earnings, 0);
  const totalAgentRevenue = confirmedAgentBookings.reduce((sum, b) => sum + b.total_amount, 0);

  // Direct bookings calculations
  const confirmedDirectBookings = directBookings.filter(
    b => b.status?.toLowerCase() === 'confirmed' || b.payment_status?.toLowerCase() === 'paid'
  );
  
  // Direct booking computation: 
  // Combined admin income = (5% commission on total price) + net markup margin
  const totalDirectRevenue = confirmedDirectBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const totalDirectCommission = Math.round(totalDirectRevenue * (commissionRate / 100));

  // Combined Total Income
  const grandTotalAdminIncome = totalAgentCommission + totalDirectCommission;

  const handleSaveRate = () => {
    const rate = Math.max(0, Math.min(100, draftRate));
    setCommissionRate(rate);
    saveCommissionRate(rate);
    setEditingRate(false);
  };

  const handleConfirm = (booking: AgentBooking) => {
    updateAgentBookingStatus(booking.id, 'Confirmed');
    setBookings(getStoredAgentBookings());
    setNotifications(getAdminCommissionNotifications());
  };

  const handleCancel = (booking: AgentBooking) => {
    updateAgentBookingStatus(booking.id, 'Cancelled');
    setBookings(getStoredAgentBookings());
  };

  const handleDismissNotification = (id: string) => {
    dismissAdminCommissionNotification(id);
    setNotifications(getAdminCommissionNotifications());
  };

  const handleSaveOriginalPrice = async (pkgId: number) => {
    const newPrice = editingOriginalPrices[pkgId];
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price');
      return;
    }

    setSavingPackageId(pkgId);
    try {
      await updatePackageOriginalPrice(pkgId, Number(newPrice));
      setSaveSuccessId(pkgId);
      setTimeout(() => setSaveSuccessId(null), 2000);
      fetchPackagesList();
    } catch (err) {
      console.error('Failed to update original price:', err);
      alert('Error updating original price. Please try again.');
    } finally {
      setSavingPackageId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans text-slate-800">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full border border-amber-300">
              Admin Exclusive
            </span>
            <span className="text-xs text-slate-400">· Profit & Commission Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commissions & Revenue Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor income generated from agent bookings, direct client bookings, and manage confidential package costs.
          </p>
        </div>

        {/* Commission Rate Editor */}
        <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-2xl px-4 py-3 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <FiEdit2 size={15} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Admin Commission Rate</p>
            {editingRate ? (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={draftRate}
                  onChange={e => setDraftRate(parseFloat(e.target.value) || 0)}
                  className="w-16 text-sm font-bold border border-amber-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-sm font-bold text-slate-600">%</span>
                <button 
                  onClick={handleSaveRate} 
                  className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer shadow-xs"
                  title="Save Rate"
                >
                  <FiSave size={13} />
                </button>
                <button 
                  onClick={() => { setEditingRate(false); setDraftRate(commissionRate); }} 
                  className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer"
                  title="Cancel"
                >
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-amber-700">{commissionRate}%</span>
                <button 
                  onClick={() => setEditingRate(true)} 
                  className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                >
                  Edit Rate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications / Alerts Feed */}
      {notifications.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <FiBell className="text-amber-600" /> Commission Alerts & Booking Messages ({notifications.length})
            </span>
          </div>

          <div className="space-y-2">
            {notifications.map((note) => {
              const isConfirmed = note.type === 'booking_confirmed';
              return (
                <div 
                  key={note.id} 
                  className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3.5 text-xs shadow-xs border transition-all ${
                    isConfirmed 
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isConfirmed ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                      <FiBell size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-xs">{note.title}</p>
                      <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{note.message}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDismissNotification(note.id)} 
                    className="opacity-50 hover:opacity-100 p-1 rounded-lg transition-opacity cursor-pointer shrink-0"
                    title="Dismiss notification"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FiDollarSign size={20} />}
          label="Total Admin Commission"
          value={`₱${grandTotalAdminIncome.toLocaleString()}`}
          sub={`From all confirmed bookings (${commissionRate}%)`}
          color="amber"
        />
        <StatCard
          icon={<FiUsers size={20} />}
          label="From Agent Bookings"
          value={`₱${totalAgentCommission.toLocaleString()}`}
          sub={`${confirmedAgentBookings.length} confirmed agent tours`}
          color="blue"
        />
        <StatCard
          icon={<FiGlobe size={20} />}
          label="From Direct Bookings"
          value={`₱${totalDirectCommission.toLocaleString()}`}
          sub={`${confirmedDirectBookings.length} confirmed direct tours`}
          color="emerald"
        />
        <StatCard
          icon={<FiClock size={20} />}
          label="Pending Agent Bookings"
          value={String(pendingAgentBookings.length)}
          sub="Awaiting admin confirmation"
          color="orange"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'agents'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiUsers size={14} /> Agent Bookings & Cut ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'direct'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiGlobe size={14} /> Direct Website Bookings ({directBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiLock size={14} /> Confidential Package Pricing ({packages.length})
        </button>
      </div>

      {/* TAB 1: Agent Bookings Commissions */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Agent Booking Commissions</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Admin receives {commissionRate}% commission from total package booking, while agent retains their markup.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
              {bookings.length} Bookings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  {['Booking ID','Client','Agent','Tour Package','Pax','Base Cost (Admin Only)','Agent Markup','Total Paid','Admin Commission','Agent Profit','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400 text-xs">
                      No agent bookings recorded yet. Bookings submitted by agents will appear here instantly.
                    </td>
                  </tr>
                ) : bookings.map(b => {
                  const liveCommission = Math.round(b.total_amount * (commissionRate / 100));

                  return (
                    <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">{b.id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{b.client_name}</p>
                        <p className="text-[11px] text-slate-400">{b.client_email}</p>
                        <p className="text-[10px] text-slate-400">{b.client_phone}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{b.agent_name}</p>
                        <p className="text-[11px] text-slate-400">{b.agent_email}</p>
                      </td>
                      <td className="px-4 py-3.5 max-w-[170px]">
                        <p className="font-medium text-slate-800 truncate">{b.tour_package}</p>
                        <p className="text-[11px] text-slate-400">{b.tour_date}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">{b.pax}</td>

                      {/* Base cost visible strictly to Admin */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200" title="Protected from Agents">
                          <FiLock size={10} className="text-amber-600" />
                          <span>₱{b.base_price_per_pax.toLocaleString()}/pax</span>
                        </div>
                      </td>

                      {/* Agent markup */}
                      <td className="px-4 py-3.5 font-semibold text-amber-700 whitespace-nowrap">
                        +₱{b.markup_per_pax.toLocaleString()}/pax
                      </td>

                      {/* Total Amount Paid */}
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                        ₱{b.total_amount.toLocaleString()}
                      </td>

                      {/* Admin Commission */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                          ₱{liveCommission.toLocaleString()}
                          <span className="text-emerald-600 font-normal text-[10px]">({commissionRate}%)</span>
                        </span>
                      </td>

                      {/* Agent Earnings */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                          ₱{b.agent_earnings.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {b.status === 'Pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirm(b)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <FiCheckCircle size={12} /> Confirm & Claim
                            </button>
                            <button
                              onClick={() => handleCancel(b)}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Agent Bookings Summary Footer */}
          {confirmedAgentBookings.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap gap-6 justify-end text-xs">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Agent Revenue</p>
                <p className="text-base font-extrabold text-slate-800">₱{totalAgentRevenue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Commission ({commissionRate}%)</p>
                <p className="text-base font-extrabold text-amber-700">₱{totalAgentCommission.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Agent Profits Paid Out</p>
                <p className="text-base font-extrabold text-blue-700">₱{totalAgentEarnings.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Direct Website Bookings */}
      {activeTab === 'direct' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Direct Client Bookings & Admin Earnings</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bookings made directly by clients on the website without an agent. Admin retains full revenue plus {commissionRate}% commission computation.
              </p>
            </div>
            <button 
              onClick={fetchDirectBookings}
              className="p-2 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
              title="Refresh"
            >
              <FiRefreshCw size={14} className={loadingDirect ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  {['ID', 'Client Name', 'Tour Package', 'Guests', 'Total Paid', 'Admin Cut (5%)', 'Net Direct Revenue', 'Payment Status', 'Booking Status'].map(h => (
                    <th key={h} className="px-4 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDirect ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs">
                      Loading direct bookings...
                    </td>
                  </tr>
                ) : directBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs">
                      No direct client bookings found in the system.
                    </td>
                  </tr>
                ) : directBookings.map((db) => {
                  const cut = Math.round(Number(db.total_amount || 0) * (commissionRate / 100));

                  return (
                    <tr key={db.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-500">{db.id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{db.lead_guest_name}</p>
                        <p className="text-[11px] text-slate-400">{db.email}</p>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-semibold text-slate-800 truncate">{db.tour_package}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">{db.pax}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                        ₱{Number(db.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-emerald-700">
                        ₱{cut.toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({commissionRate}%)</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-amber-800">
                        ₱{Number(db.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          db.payment_status?.toLowerCase() === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {db.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={db.status || 'Pending'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {confirmedDirectBookings.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap gap-6 justify-end text-xs">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Direct Revenue</p>
                <p className="text-base font-extrabold text-slate-800">₱{totalDirectRevenue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Direct Commission Share ({commissionRate}%)</p>
                <p className="text-base font-extrabold text-emerald-700">₱{totalDirectCommission.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Confidential Package Pricing (Original Price Editor) */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Security Banner */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <FiShield size={18} />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <p className="font-bold text-amber-950 text-sm">Confidential Pricing & Agent Shield Policy</p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                The <strong>Original Price (Net Cost)</strong> represents your wholesale operating expense for each package.
                Agents are strictly restricted from seeing or modifying this value; it is only viewable and editable by you here.
                Agents only have the ability to configure their <strong>mark-up per pax</strong>.
              </p>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Tour Listings — Confidential Net Cost Control</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update wholesale original prices. Changes immediately recalculate profit margins across the system.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                {packages.length} Packages
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Tour Package Title</th>
                    <th className="px-5 py-3.5">Destinations</th>
                    <th className="px-5 py-3.5">Selling Price (Public)</th>
                    <th className="px-5 py-3.5">Original Price (Confidential Cost)</th>
                    <th className="px-5 py-3.5">Admin Profit Margin</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPackages ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                        Loading tour packages...
                      </td>
                    </tr>
                  ) : packages.map((pkg) => {
                    const originalPriceVal = editingOriginalPrices[pkg.id] ?? pkg.original_price ?? 0;
                    const margin = Number(pkg.price || 0) - Number(originalPriceVal);
                    const isSaving = savingPackageId === pkg.id;
                    const isSaved = saveSuccessId === pkg.id;

                    return (
                      <tr key={pkg.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-500">{pkg.id}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{pkg.title}</td>
                        <td className="px-5 py-4 font-semibold text-slate-600">{pkg.destinations ?? 5} spots</td>
                        
                        {/* Selling Price */}
                        <td className="px-5 py-4 font-black text-slate-900 text-sm whitespace-nowrap">
                          ₱{Number(pkg.price || 0).toLocaleString()}
                        </td>

                        {/* Original Price Editor */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-bold">₱</span>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={originalPriceVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingOriginalPrices(prev => ({ ...prev, [pkg.id]: val }));
                              }}
                              className="w-28 px-2.5 py-1.5 border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                            />
                            <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-semibold" title="Hidden from agents">
                              <FiLock size={10} /> Hidden
                            </div>
                          </div>
                        </td>

                        {/* Profit Margin */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`font-extrabold text-xs px-2.5 py-1 rounded-lg ${
                            margin >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            ₱{margin.toLocaleString()}
                          </span>
                        </td>

                        {/* Save Button */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleSaveOriginalPrice(pkg.id)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
                              isSaved 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] text-white disabled:opacity-50'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <FiCheck size={12} /> Saved!
                              </>
                            ) : isSaving ? (
                              'Saving…'
                            ) : (
                              <>
                                <FiSave size={12} /> Save Price
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Policy Info Box */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 text-xs text-slate-500 space-y-1.5 shadow-xs">
        <p className="font-bold text-slate-800 text-sm mb-1.5">Business & Commission Computation Model</p>
        <p>• <strong>Agent Bookings:</strong> The agent applies their custom mark-up per pax on top of the tour price. Once the booking is paid and confirmed, you receive <strong>{commissionRate}% commission</strong> of the total booking price, while the agent earns their full mark-up.</p>
        <p>• <strong>Direct Bookings:</strong> Clients who book directly generate full revenue for you. The {commissionRate}% commission computation allows you to track revenue alongside agent channels.</p>
        <p>• <strong>Confidential Pricing:</strong> You are the only person who can edit the wholesale Original Price of each listing. Agents will only ever see their own mark-up settings.</p>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  sub, 
  color 
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'emerald' | 'blue' | 'orange';
}) {
  const colors = {
    amber:   'from-amber-500 to-amber-700',
    emerald: 'from-emerald-500 to-emerald-700',
    blue:    'from-blue-500 to-blue-700',
    orange:  'from-orange-400 to-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-md shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xl font-extrabold text-slate-900 mt-0.5">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: 'bg-emerald-100 text-emerald-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    Pending:   'bg-amber-100 text-amber-800',
    pending:   'bg-amber-100 text-amber-800',
    Cancelled: 'bg-rose-100 text-rose-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}