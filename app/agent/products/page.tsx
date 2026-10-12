'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiLock, 
  FiEdit2, 
  FiCheck, 
  FiDollarSign, 
  FiInfo, 
  FiShield, 
  FiMapPin 
} from 'react-icons/fi';
import { getPackages } from '@/lib/actions/packages';
import { 
  getActiveAgent, 
  getAgentMarkups, 
  saveAgentMarkup, 
  AgentProfile 
} from '@/lib/agent-service';

type TourPackage = {
  id: number;
  title: string;
  description: string;
  destinations: number;
  destination_details?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  original_price: number;
  price: number;
  image?: string;
};

export default function AgentProductsPage() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentProfile>(getActiveAgent());
  const [markups, setMarkups] = useState<Record<string, number>>({});

  // Modal State for adjusting markup
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null);
  const [inputMarkup, setInputMarkup] = useState<number>(500);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const curAgent = getActiveAgent();
    setAgent(curAgent);
    setMarkups(getAgentMarkups(curAgent.email));

    getPackages()
      .then((data) => {
        if (data && data.length > 0) {
          setPackages(data as TourPackage[]);
        } else {
          // Fallback packages if DB not seeded
          setPackages([
            {
              id: 1,
              title: 'El Nido 4D3N Complete Island Adventure',
              description: 'All-inclusive tour of Big Lagoon, Shimizu Island, and 7 Commandos.',
              destinations: 7,
              price: 6500,
              original_price: 5200
            },
            {
              id: 2,
              title: 'Tour A with Buffet Lunch',
              description: 'Lagoon kayaking, coral snorkeling, and beach relaxation.',
              destinations: 5,
              price: 2400,
              original_price: 1800
            },
            {
              id: 3,
              title: 'Coron Island Escape Day Tour',
              description: 'Kayangan Lake, Twin Lagoon, and crystal-clear snorkeling spots.',
              destinations: 6,
              price: 4000,
              original_price: 3100
            }
          ]);
        }
      })
      .catch((err) => {
        console.error('Error fetching packages:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const openMarkupModal = (pkg: TourPackage) => {
    setSelectedPkg(pkg);
    const existing = markups[String(pkg.id)] || agent.defaultMarkup || 500;
    setInputMarkup(existing);
    setSavedSuccess(false);
  };

  const handleSaveMarkup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    saveAgentMarkup(selectedPkg.id, inputMarkup, agent.email);
    setMarkups((prev) => ({ ...prev, [String(selectedPkg.id)]: inputMarkup }));
    setSavedSuccess(true);
    setTimeout(() => {
      setSelectedPkg(null);
      setSavedSuccess(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-900">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-amber-200/60 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
            Agent Catalog & Profit Control
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Tour Services & Mark-up Settings</h1>
          <p className="text-xs text-slate-600">
            Configure your personalized mark-up for each tour package. Original package costs are confidential.
          </p>
        </div>

        <div className="bg-white border border-amber-200 px-4 py-2 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
            <FiShield size={16} />
          </div>
          <div className="text-right sm:text-left">
            <p className="text-[10px] uppercase font-bold text-slate-400">Net Cost Protection</p>
            <p className="text-xs font-bold text-slate-800">Admin-Protected Pricing</p>
          </div>
        </div>
      </div>

      {/* Security & Policy Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <FiInfo size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">Pricing Policy & Commission Model</p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            1. <strong>Original Price is strictly hidden</strong> from all tour agents and can only be set or edited by the Admin (Jasmine).<br />
            2. You have complete autonomy to customize your <strong>mark-up per pax</strong> on every package.<br />
            3. The Admin receives a <strong>5% commission</strong> from your client bookings, and you keep <strong>100% of your mark-up</strong> as profit.
          </p>
        </div>
      </div>

      {/* Packages Table with Confidential Net Cost */}
      <div className="bg-white border border-amber-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-amber-100 flex justify-between items-center bg-[#fcfbf9]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Available Tour Packages ({packages.length})
          </h3>
          <span className="text-[11px] text-slate-400">Agent: {agent.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-5">Package Title</th>
                <th className="py-3.5 px-5">Destinations</th>
                <th className="py-3.5 px-5">Original Net Cost</th>
                <th className="py-3.5 px-5">Your Mark-up / Pax</th>
                <th className="py-3.5 px-5">Client Selling Price</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading tour packages...
                  </td>
                </tr>
              ) : packages.map((pkg) => {
                const markup = markups[String(pkg.id)] ?? agent.defaultMarkup ?? 500;
                const sellingPrice = Number(pkg.price || 0) + Number(markup);

                return (
                  <tr key={pkg.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-900">{pkg.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{pkg.description}</p>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin size={12} className="text-amber-700" />
                        {pkg.destinations} spots
                      </span>
                    </td>

                    {/* Original Price is explicitly HIDDEN */}
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]" title="Confidential to Admin Only">
                        <FiLock size={12} className="text-slate-400" />
                        <span>•••••• (Protected)</span>
                      </div>
                    </td>

                    {/* Your Mark-up */}
                    <td className="py-4 px-5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                        +₱{Number(markup).toLocaleString()} / pax
                      </span>
                    </td>

                    {/* Client Retail Price */}
                    <td className="py-4 px-5 font-bold text-slate-900 text-sm">
                      ₱{sellingPrice.toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openMarkupModal(pkg)}
                        className="bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiEdit2 size={12} />
                        <span>Edit Mark-Up</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Mark-Up Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Configure Profit Margin
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedPkg.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPkg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMarkup} className="space-y-4">
              {/* Confidentiality Warning */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <FiLock size={12} className="text-amber-600" />
                  Base Cost: Confidential to Jasmine / Admin
                </p>
                <p className="text-slate-500">
                  Your customized mark-up will be added to the final quotation and booking price charged to your clients.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Custom Mark-Up (₱ per pax)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={inputMarkup}
                    onChange={(e) => setInputMarkup(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Dynamic Profit Calculation Preview */}
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <p className="font-bold text-emerald-950 uppercase text-[10px] tracking-wider">
                  Live Earnings Projection
                </p>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Markup on 2 Guests:</span>
                  <span className="font-bold text-emerald-700">₱{(inputMarkup * 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Markup on 5 Guests:</span>
                  <span className="font-bold text-emerald-700">₱{(inputMarkup * 5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-emerald-200 text-slate-700 font-semibold">
                  <span>Admin 5% Cut:</span>
                  <span className="text-[11px] text-amber-800">5% of total synced automatically</span>
                </div>
              </div>

              {savedSuccess && (
                <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <FiCheck size={14} /> Mark-up saved successfully!
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPkg(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FiCheck size={14} />
                  <span>Save My Mark-Up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
