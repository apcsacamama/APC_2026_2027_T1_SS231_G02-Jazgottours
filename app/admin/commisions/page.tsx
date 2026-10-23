"use client"
 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import { FiDollarSign, FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiEdit2, FiSave, FiX, FiBell, FiShoppingBag } from 'react-icons/fi';

import {
  getStoredAgentBookings,
  fetchAgentBookingsFromSupabase,
  updateAgentBookingStatus,
  type AgentBooking,
} from '@/lib/agent-service';
 
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
 
export default function CommissionsPage() {

  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [directBookings, setDirectBookings] = useState<any[]>([]);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);
  const [editingRate, setEditingRate] = useState(false);
  const [draftRate, setDraftRate] = useState(DEFAULT_COMMISSION_RATE);
  const [notifications, setNotifications] = useState<string[]>([]);
 
  useEffect(() => {
    const rate = getCommissionRate();
    setCommissionRate(rate);
    setDraftRate(rate);
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // 1. Agent bookings: merge localStorage + Supabase agent_bookings
    const local = getStoredAgentBookings();
    const dbAgent = await fetchAgentBookingsFromSupabase({ id: '', name: '', email: '', code: '', defaultMarkup: 500 } as any)
      .catch(() => [] as AgentBooking[]);

    // Fetch ALL agent_bookings from Supabase (not filtered by agent)
    const { data: allAgentRows } = await supabase
      .from('agent_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    const supabaseMapped: AgentBooking[] = (allAgentRows || []).map((row: any) => ({
      id: row.id,
      client_name: row.client_name || '',
      client_email: row.client_email || '',
      client_phone: row.client_phone || '',
      tour_package: row.tour_package || '',
      pax: Number(row.pax) || 1,
      tour_date: row.tour_date || '',
      is_agent_booking: true,
      agent_id: row.agent_id || '',
      agent_name: row.agent_name || '',
      agent_email: row.agent_email || '',
      base_price_per_pax: 0,
      markup_per_pax: Number(row.markup_per_pax) || 0,
      total_price_per_pax: 0,
      total_amount: Number(row.total_amount) || 0,
      agent_earnings: Number(row.agent_earnings) || 0,
      admin_commission: Number(row.admin_commission) || 0,
      status: row.status as AgentBooking['status'] || 'Pending',
      created_at: row.created_at || new Date().toISOString(),
    }));

    // Deduplicate: Supabase wins on matching id
    const merged = [...supabaseMapped];
    const dbIds = new Set(supabaseMapped.map(b => b.id));
    local.forEach(b => { if (!dbIds.has(b.id)) merged.push(b); });
    setBookings(merged);

    // Auto-notify for any pending agent-referred bookings
    const pending = merged.filter(b => b.status === 'Pending');
    if (pending.length > 0) {
      const msgs = pending.map(b =>
        `New referral booking pending! Client: ${b.client_name} | Agent: ${b.agent_name} (${b.tour_package}) | Agent Markup: ₱${b.agent_earnings.toLocaleString()}`
      );
      setNotifications(msgs);
    }

    // 2. Direct bookings (no agent referral code) — compute 5% admin commission
    const { data: directRows } = await supabase
      .from('bookings')
      .select('id, lead_guest_name, tour_package, pax, tour_date, total_amount, payment_status, status, created_at')
      .is('agent_referral_code', null)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });
    setDirectBookings(directRows || []);
  };
 
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

  const pendingBookings = bookings.filter(b => b.status === 'Pending');

  const totalCommission = confirmedBookings.reduce((sum, b) => sum + Math.round(b.total_amount * (commissionRate / 100)), 0);

  const totalAgentEarnings = confirmedBookings.reduce((sum, b) => sum + b.agent_earnings, 0);

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);
 
  const handleSaveRate = () => {

    const rate = Math.max(0, Math.min(100, draftRate));

    setCommissionRate(rate);

    saveCommissionRate(rate);

    setEditingRate(false);

  };
 
  const handleConfirm = async (booking: AgentBooking) => {
    // Update localStorage
    updateAgentBookingStatus(booking.id, 'Confirmed');
    // Update Supabase agent_bookings
    await supabase.from('agent_bookings').update({ status: 'Confirmed' }).eq('id', booking.id);
    loadAllData();
    const commission = Math.round(booking.total_amount * (commissionRate / 100));
    const msg = `✅ Booking ${booking.id} confirmed! Client: ${booking.client_name} | Agent: ${booking.agent_name} | Tour: ${booking.tour_package} | Admin Commission: ₱${commission.toLocaleString()} | Agent Markup: ₱${booking.agent_earnings.toLocaleString()}`;
    setNotifications(prev => [msg, ...prev]);
  };
 
  const handleCancel = async (booking: AgentBooking) => {
    updateAgentBookingStatus(booking.id, 'Cancelled');
    await supabase.from('agent_bookings').update({ status: 'Cancelled' }).eq('id', booking.id);
    loadAllData();
  };
 
  const dismissNotification = (i: number) => {

    setNotifications(prev => prev.filter((_, idx) => idx !== i));

  };
 
  return (
<div className="space-y-8">

      {/* Page Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<div>
<h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Commission Dashboard</h1>
<p className="text-sm text-slate-500 mt-1">Admin-only view · Income generated from agent bookings</p>
</div>
 
        {/* Commission Rate Editor */}
<div className="flex items-center gap-3 bg-white border border-amber-200 rounded-2xl px-4 py-3 shadow-sm">
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

                  onChange={e => setDraftRate(parseFloat(e.target.value))}

                  className="w-16 text-sm font-bold border border-amber-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"

                />
<span className="text-sm text-slate-600">%</span>
<button onClick={handleSaveRate} className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer">
<FiSave size={13} />
</button>
<button onClick={() => { setEditingRate(false); setDraftRate(commissionRate); }} className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer">
<FiX size={13} />
</button>
</div>

            ) : (
<div className="flex items-center gap-2 mt-0.5">
<span className="text-xl font-extrabold text-amber-700">{commissionRate}%</span>
<button onClick={() => setEditingRate(true)} className="text-xs text-amber-600 hover:underline cursor-pointer">Edit</button>
</div>

            )}
</div>
</div>
</div>
 
      {/* Notifications */}

      {notifications.length > 0 && (
<div className="space-y-2">

          {notifications.map((note, i) => (
<div key={i} className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm shadow-sm">
<div className="flex items-start gap-2">
<FiBell className="mt-0.5 shrink-0 text-emerald-600" size={16} />
<span>{note}</span>
</div>
<button onClick={() => dismissNotification(i)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer shrink-0">
<FiX size={14} />
</button>
</div>

          ))}
</div>

      )}
 
      {/* Stats Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<StatCard

          icon={<FiDollarSign size={20} />}

          label="Total Admin Commission"

          value={`₱${totalCommission.toLocaleString()}`}

          sub="From confirmed bookings"

          color="amber"

        />
<StatCard

          icon={<FiTrendingUp size={20} />}

          label="Total Revenue Generated"

          value={`₱${totalRevenue.toLocaleString()}`}

          sub="Confirmed bookings only"

          color="emerald"

        />
<StatCard

          icon={<FiUsers size={20} />}

          label="Agent Earnings (Total)"

          value={`₱${totalAgentEarnings.toLocaleString()}`}

          sub="Markup earned by agents"

          color="blue"

        />
<StatCard

          icon={<FiClock size={20} />}

          label="Pending Bookings"

          value={String(pendingBookings.length)}

          sub="Awaiting confirmation"

          color="orange"

        />
</div>
 
      {/* Bookings Table */}
<div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
<h2 className="font-bold text-slate-800 text-base">Agent Booking Commissions</h2>
<span className="text-xs text-slate-400">{bookings.length} total bookings</span>
</div>
 
        <div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-slate-50 text-left">

                {['Booking ID','Client','Agent','Tour Package','Pax','Base Price','Markup/Pax','Total Amount','Admin Commission','Agent Earnings','Status','Actions'].map(h => (
<th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>

                ))}
</tr>
</thead>
<tbody className="divide-y divide-slate-100">

              {bookings.length === 0 ? (
<tr>
<td colSpan={12} className="px-6 py-12 text-center text-slate-400 text-sm">

                    No agent bookings yet. Bookings will appear here once agents submit them.
</td>
</tr>

              ) : bookings.map(b => {

                const liveCommission = Math.round(b.total_amount * (commissionRate / 100));

                return (
<tr key={b.id} className="hover:bg-slate-50 transition-colors">
<td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{b.id}</td>
<td className="px-4 py-3 whitespace-nowrap">
<p className="font-semibold text-slate-800">{b.client_name}</p>
<p className="text-xs text-slate-400">{b.client_email}</p>
</td>
<td className="px-4 py-3 whitespace-nowrap">
<p className="font-semibold text-slate-700">{b.agent_name}</p>
<p className="text-xs text-slate-400">{b.agent_email}</p>
</td>
<td className="px-4 py-3 max-w-[160px]">
<p className="font-medium text-slate-700 truncate">{b.tour_package}</p>
<p className="text-xs text-slate-400">{b.tour_date}</p>
</td>
<td className="px-4 py-3 text-center font-bold text-slate-700">{b.pax}</td>

                    {/* Base price visible only to admin */}
<td className="px-4 py-3 text-slate-600 whitespace-nowrap">₱{b.base_price_per_pax.toLocaleString()}/pax</td>
<td className="px-4 py-3 text-amber-700 font-semibold whitespace-nowrap">+₱{b.markup_per_pax.toLocaleString()}</td>
<td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">₱{b.total_amount.toLocaleString()}</td>
<td className="px-4 py-3 whitespace-nowrap">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">

                        ₱{liveCommission.toLocaleString()}
<span className="text-amber-500 font-normal">({commissionRate}%)</span>
</span>
</td>
<td className="px-4 py-3 whitespace-nowrap">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">

                        ₱{b.agent_earnings.toLocaleString()}
</span>
</td>
<td className="px-4 py-3 whitespace-nowrap">
<StatusBadge status={b.status} />
</td>
<td className="px-4 py-3 whitespace-nowrap">

                      {b.status === 'Pending' ? (
<div className="flex items-center gap-2">
<button

                            onClick={() => handleConfirm(b)}

                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
>
<FiCheckCircle size={12} /> Confirm
</button>
<button

                            onClick={() => handleCancel(b)}

                            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
>

                            Cancel
</button>
</div>

                      ) : (
<span className="text-xs text-slate-400 italic">{b.status}</span>

                      )}
</td>
</tr>

                );

              })}
</tbody>
</table>
</div>
 
        {/* Summary Footer */}

        {confirmedBookings.length > 0 && (
<div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-6 justify-end text-sm">
<div className="text-right">
<p className="text-xs text-slate-500 font-medium">Total Revenue (Confirmed)</p>
<p className="text-lg font-extrabold text-slate-800">₱{totalRevenue.toLocaleString()}</p>
</div>
<div className="text-right">
<p className="text-xs text-slate-500 font-medium">Your Commission ({commissionRate}%)</p>
<p className="text-lg font-extrabold text-amber-700">₱{totalCommission.toLocaleString()}</p>
</div>
<div className="text-right">
<p className="text-xs text-slate-500 font-medium">Agent Earnings</p>
<p className="text-lg font-extrabold text-blue-700">₱{totalAgentEarnings.toLocaleString()}</p>
</div>
</div>

        )}
</div>
 
      {/* Direct Booking Commissions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
<div className="flex items-center gap-2">
<FiShoppingBag size={16} className="text-slate-500" />
<h2 className="font-bold text-slate-800 text-base">Direct Booking Commissions</h2>
</div>
<span className="text-xs text-slate-400">{directBookings.length} paid direct bookings</span>
</div>
        <div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-slate-50 text-left">
            {['Booking ID','Client','Tour Package','Pax','Tour Date','Total Amount','Admin Commission ('+commissionRate+'%)'].map(h => (
<th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
            ))}
</tr>
</thead>
<tbody className="divide-y divide-slate-100">
            {directBookings.length === 0 ? (
<tr>
<td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No direct paid bookings yet.
</td>
</tr>
            ) : directBookings.map((b: any) => {
              const commission = Math.round(Number(b.total_amount) * (commissionRate / 100));
              return (
<tr key={b.id} className="hover:bg-slate-50 transition-colors">
<td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{b.id}</td>
<td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{b.lead_guest_name}</td>
<td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{b.tour_package}</td>
<td className="px-4 py-3 text-center font-bold text-slate-700">{b.pax}</td>
<td className="px-4 py-3 text-slate-500 whitespace-nowrap">{b.tour_date}</td>
<td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">₱{Number(b.total_amount).toLocaleString()}</td>
<td className="px-4 py-3 whitespace-nowrap">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                      ₱{commission.toLocaleString()}
<span className="text-amber-500 font-normal">({commissionRate}%)</span>
</span>
</td>
</tr>
              );
            })}
</tbody>
</table>
</div>
        {directBookings.length > 0 && (() => {
          const totalDirect = directBookings.reduce((s: number, b: any) => s + Math.round(Number(b.total_amount) * (commissionRate / 100)), 0);
          const totalDirectRevenue = directBookings.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
          return (
<div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-6 justify-end text-sm">
<div className="text-right">
<p className="text-xs text-slate-500 font-medium">Direct Booking Revenue</p>
<p className="text-lg font-extrabold text-slate-800">₱{totalDirectRevenue.toLocaleString()}</p>
</div>
<div className="text-right">
<p className="text-xs text-slate-500 font-medium">Your Commission ({commissionRate}%)</p>
<p className="text-lg font-extrabold text-amber-700">₱{totalDirect.toLocaleString()}</p>
</div>
</div>
          );
        })()}
</div>

      {/* Legend */}
<div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 text-xs text-slate-500 space-y-1 shadow-sm">
<p className="font-bold text-slate-700 text-sm mb-2">How Commissions Are Calculated</p>
<p>• <strong>Base Price</strong> — Original tour price set by admin only (hidden from agents).</p>
<p>• <strong>Markup</strong> — Amount added by the agent per pax. Only the agent can set this. This becomes the agent's earnings.</p>
<p>• <strong>Total Amount</strong> — What the client pays: (Base Price + Markup) × number of pax.</p>
<p>• <strong>Admin Commission</strong> — {commissionRate}% of Total Amount. You earn this on every confirmed agent booking.</p>
</div>
</div>

  );

}
 
function StatCard({ icon, label, value, sub, color }: {

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
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
<div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-md shrink-0`}>

        {icon}
</div>
<div>
<p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
<p className="text-2xl font-extrabold text-slate-900 mt-0.5">{value}</p>
<p className="text-xs text-slate-400 mt-0.5">{sub}</p>
</div>
</div>

  );

}
 
function StatusBadge({ status }: { status: string }) {

  const map: Record<string, string> = {

    Confirmed: 'bg-emerald-100 text-emerald-700',

    Pending:   'bg-amber-100 text-amber-700',

    Cancelled: 'bg-rose-100 text-rose-700',

  };

  return (
<span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>

      {status}
</span>

  );

}
 