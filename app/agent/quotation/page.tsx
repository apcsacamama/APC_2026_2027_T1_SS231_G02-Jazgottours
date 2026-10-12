'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiFileText, 
  FiPlus, 
  FiCheck, 
  FiUser, 
  FiCalendar, 
  FiDollarSign, 
  FiPrinter,
  FiShare2
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { 
  getActiveAgent, 
  syncActiveAgentFromUser,
  getAgentMarkups, 
  AgentProfile 
} from '@/lib/agent-service';
import { getPackages } from '@/lib/actions/packages';

export default function AgentQuotationPage() {
  const [agent, setAgent] = useState<AgentProfile>(() => getActiveAgent());
  const [packages, setPackages] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [pax, setPax] = useState<number>(4);
  const [tourDate, setTourDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [markupPerPax, setMarkupPerPax] = useState<number>(500);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  useEffect(() => {
    const init = async () => {
      let curAgent = getActiveAgent();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        curAgent = syncActiveAgentFromUser(session.user);
      }
      setAgent(curAgent);
      const mks = getAgentMarkups(curAgent.email);

      getPackages().then((data) => {
        if (data && data.length > 0) {
          setPackages(data);
          setSelectedTour(data[0]);
          setMarkupPerPax(mks[String(data[0].id)] ?? curAgent.defaultMarkup ?? 500);
        } else {
          const fb = [
            { id: 1, title: 'El Nido 4D3N Complete Island Adventure', price: 6500 },
            { id: 2, title: 'Tour A with Buffet Lunch', price: 2400 }
          ];
          setPackages(fb);
          setSelectedTour(fb[0]);
        }
      });
    };

    init();
  }, []);

  const basePrice = Number(selectedTour?.price || 5000);
  const ratePerPax = basePrice + markupPerPax;
  const totalAmount = ratePerPax * pax;
  const agentMarkupTotal = markupPerPax * pax;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Please enter client name');
      return;
    }
    setQuoteGenerated(true);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans text-slate-900 space-y-6">
      
      {/* Header */}
      <div className="border-b border-amber-200/60 pb-5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
          Agent Quotations • {agent.code}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Client Tour Quotation Generator</h1>
        <p className="text-xs text-slate-600">
          Draft official quotes for your clients with your custom mark-up automatically bundled.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Form */}
        <form onSubmit={handleGenerate} className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FiFileText className="text-amber-600" />
            <span>Quotation Configuration</span>
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tour Package</label>
            <select
              value={selectedTour?.id}
              onChange={(e) => {
                const found = packages.find((p) => String(p.id) === e.target.value);
                setSelectedTour(found);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Client Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John & Sarah Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Client Email</label>
            <input
              type="email"
              placeholder="client@gmail.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Guests (Pax)</label>
              <input
                type="number"
                min={1}
                value={pax}
                onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Travel Date</label>
              <input
                type="date"
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Your Mark-Up (₱ per pax)</label>
              <span className="text-[11px] text-emerald-700 font-bold">Your Profit</span>
            </div>
            <input
              type="number"
              min={0}
              step={50}
              value={markupPerPax}
              onChange={(e) => setMarkupPerPax(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            Generate Quotation Preview
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-amber-100 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Official Tour Quotation</p>
                <h3 className="text-base font-bold text-slate-900">Jazgot Tour Services</h3>
                <p className="text-[10px] text-slate-500">Agent Partner: {agent.name} ({agent.code})</p>
              </div>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                VALID 14 DAYS
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Prepared For:</span>
                <span className="font-bold text-slate-900">{clientName || 'Valued Client'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tour Package:</span>
                <span className="font-semibold text-slate-800">{selectedTour?.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Proposed Tour Date:</span>
                <span className="font-semibold text-slate-800">{new Date(tourDate).toDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Party Size:</span>
                <span className="font-semibold text-slate-800">{pax} Guests</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Retail Rate per Guest:</span>
                <span className="font-bold text-slate-900">₱{ratePerPax.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-[#fcfbf9] p-4 rounded-2xl border border-amber-200 space-y-1">
              <div className="flex justify-between items-center text-slate-900">
                <span className="font-bold text-xs uppercase tracking-wider">Total Quotation Value:</span>
                <span className="font-extrabold text-xl text-amber-900">₱{totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Inclusive of environmental fees, licensed guide, boat transfer, and tour gear.
              </p>
            </div>

            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
              <span className="text-emerald-800 font-semibold">Your Mark-up Profit:</span>
              <span className="font-extrabold text-emerald-700">₱{agentMarkupTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => alert('Quotation ready for printing or saving as PDF.')}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiPrinter size={13} /> Print / Save PDF
            </button>
            <Link
              href="/agent/book"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              Proceed to Book
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
