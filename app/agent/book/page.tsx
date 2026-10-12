'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiPlusCircle, 
  FiUser, 
  FiCalendar, 
  FiPhone, 
  FiMail, 
  FiCheckCircle, 
  FiShield, 
  FiTrendingUp, 
  FiLock,
  FiArrowRight
} from 'react-icons/fi';
import { getPackages } from '@/lib/actions/packages';
import { supabase } from '@/lib/supabase';
import { 
  getActiveAgent, 
  syncActiveAgentFromUser,
  getAgentMarkups, 
  createAgentBooking, 
  AgentProfile 
} from '@/lib/agent-service';

export default function AgentBookPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile>(() => getActiveAgent());
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Form Fields
  const [selectedPkgId, setSelectedPkgId] = useState<number | string>(1);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [pax, setPax] = useState<number>(2);
  const [tourDate, setTourDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [markupOverride, setMarkupOverride] = useState<number>(500);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  useEffect(() => {
    const init = async () => {
      let curAgent = getActiveAgent();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        curAgent = syncActiveAgentFromUser(session.user);
      }
      setAgent(curAgent);
      const markups = getAgentMarkups(curAgent.email);

      getPackages()
        .then((data) => {
          if (data && data.length > 0) {
            setPackages(data);
            setSelectedPkgId(data[0].id);
            const defaultMk = markups[String(data[0].id)] ?? curAgent.defaultMarkup ?? 500;
            setMarkupOverride(defaultMk);
          } else {
            const fallback = [
              { id: 1, title: 'El Nido 4D3N Complete Island Adventure', price: 6500 },
              { id: 2, title: 'Tour A with Buffet Lunch', price: 2400 },
              { id: 3, title: 'Coron Island Escape Day Tour', price: 4000 }
            ];
            setPackages(fallback);
            setSelectedPkgId(fallback[0].id);
            setMarkupOverride(curAgent.defaultMarkup || 500);
          }
          setLoadingPackages(false);
        })
        .catch(() => {
          setLoadingPackages(false);
        });
    };

    init();
  }, []);

  const selectedTour = packages.find((p) => String(p.id) === String(selectedPkgId)) || packages[0];
  const baseCost = Number(selectedTour?.price || 5000);
  const clientPerPax = baseCost + markupOverride;
  const totalClientAmount = clientPerPax * pax;
  const totalAgentMarkupEarnings = markupOverride * pax;
  const adminCommission5Pct = Math.round(totalClientAmount * 0.05);

  const handlePackageChange = (id: string | number) => {
    setSelectedPkgId(id);
    const markups = getAgentMarkups(agent.email);
    const existing = markups[String(id)] ?? agent.defaultMarkup ?? 500;
    setMarkupOverride(existing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      alert('Please fill out all client details.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAgentBooking({
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        tour_package: selectedTour.title,
        package_id: selectedTour.id,
        pax,
        tour_date: tourDate,
        base_price_per_pax: baseCost,
        markup_per_pax: markupOverride,
        agent
      });

      setSuccessBooking(created);
    } catch (err: any) {
      alert('Failed to register booking: ' + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans text-slate-900 space-y-6">
      
      {/* Header */}
      <div className="border-b border-amber-200/60 pb-5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
          Agent Direct Sales
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Book Tour for Client</h1>
        <p className="text-xs text-slate-600">
          Enter your client&apos;s details below. The booking will be registered under your name, notifying Admin for immediate confirmation.
        </p>
      </div>

      {/* Agent Identification Badge */}
      <div className="bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white flex items-center justify-center font-bold text-base shadow-sm">
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Filing Under: {agent.name}</h3>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                {agent.code}
              </span>
            </div>
            <p className="text-xs text-slate-500">{agent.email} • Accredited Tour Agent</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Commission Agreement</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            5% Admin Cut + 100% Agent Markup
          </span>
        </div>
      </div>

      {/* Main Booking Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Form: 2 Cols */}
        <div className="md:col-span-2 space-y-5 bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FiUser className="text-[#dfa241]" />
            <span>1. Client & Travel Information</span>
          </h3>

          {/* Tour Package Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Selected Tour Package</label>
            <select
              value={selectedPkgId}
              onChange={(e) => handlePackageChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Travel Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tour Date</label>
              <input
                type="date"
                required
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
              />
            </div>

            {/* Pax */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Number of Guests (Pax)</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={pax}
                onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Lead Guest Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Clara Rivera"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Client Email Address</label>
              <input
                type="email"
                required
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Client Contact / WhatsApp</label>
              <input
                type="tel"
                required
                placeholder="+63 917 123 4567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
              />
            </div>
          </div>

          {/* Agent Custom Markup Input for this booking */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                Your Mark-Up for this Booking (₱ per guest)
              </label>
              <span className="text-[11px] text-emerald-700 font-bold">100% Retained by You</span>
            </div>
            <input
              type="number"
              min={0}
              step={50}
              value={markupOverride}
              onChange={(e) => setMarkupOverride(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Special Notes or Flight Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Dietary preferences, airport pickup, anniversary celebration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
            />
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4 sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Pricing & Commission
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1">
                  <FiLock size={11} className="text-slate-400" />
                  Base Package Cost:
                </span>
                <span className="font-semibold text-slate-700">•••••• (Confidential)</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Your Mark-up / Pax:</span>
                <span className="font-bold text-emerald-700">+₱{markupOverride.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Guests (Pax):</span>
                <span className="font-semibold text-slate-800">{pax} Guests</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-800">
                <span className="font-bold">Total Client Price:</span>
                <span className="font-extrabold text-base text-slate-900">
                  ₱{totalClientAmount.toLocaleString()}
                </span>
              </div>

              {/* Commission Distribution Card */}
              <div className="bg-gradient-to-br from-amber-50 to-emerald-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-2 mt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                  Automatic Revenue Split
                </p>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <FiTrendingUp size={12} /> Your Mark-up Profit:
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    ₱{totalAgentMarkupEarnings.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-amber-200/60">
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <FiShield size={12} /> Admin 5% Commission:
                  </span>
                  <span className="font-extrabold text-amber-900">
                    ₱{adminCommission5Pct.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiPlusCircle size={15} />
              <span>{submitting ? 'Registering Booking...' : 'Submit Booking Under My Name'}</span>
            </button>

            <p className="text-[10px] text-center text-slate-400">
              Admin will immediately receive this booking with confirmation controls and commission sync.
            </p>
          </div>
        </div>

      </form>

      {/* Confirmation Success Modal */}
      {successBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-sm">
              <FiCheckCircle size={36} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Ref: #{successBooking.id}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Booking Submitted Successfully!</h2>
              <p className="text-xs text-slate-500 mt-1">
                The booking for <strong className="text-slate-800">{successBooking.client_name}</strong> has been filed under <strong className="text-slate-800">{agent.name}</strong>.
              </p>
            </div>

            {/* Split breakdown confirmation */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-200 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Tour:</span>
                <span className="font-semibold text-slate-800">{successBooking.tour_package}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Client Price:</span>
                <span className="font-bold text-slate-900">₱{successBooking.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                <span>Your Mark-up Profit:</span>
                <span>₱{successBooking.agent_earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Admin 5% Commission Logged:</span>
                <span>₱{successBooking.admin_commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <span>Admin Confirmation Status:</span>
                <span className="text-amber-700 font-semibold">Pending Approval in Admin Dashboard</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  setSuccessBooking(null);
                  router.push('/agent/bookings');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                View in My Bookings
              </button>
              <button
                onClick={() => {
                  setSuccessBooking(null);
                  setClientName('');
                  setClientEmail('');
                  setClientPhone('');
                  setNotes('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Book Another Client
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
