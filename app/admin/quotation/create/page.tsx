'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CreateQuotationPage() {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Form booking and client detail fields
  const [clientName, setClientName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [tourPackage, setTourPackage] = useState('El Nido 4D3N Complete Island Adventure');
  const [tourDate, setTourDate] = useState('2026-10-15');
  const [headcount, setHeadcount] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [successModal, setSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // AI Parser logic to extract details into the verification form
  const handleAiParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsParsing(true);
    setTimeout(() => {
      const text = aiPrompt;
      
      // Extract Headcount (Pax)
      const paxMatch = text.match(/(\d+)\s*(pax|people|guests|persons)/i);
      if (paxMatch) {
        setHeadcount(parseInt(paxMatch[1]));
      }

      // Extract Client Name
      const nameMatch = text.match(/(?:nina|nora|kay|name:?|by|ako si|ang pangalan ko ay)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) || text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      if (nameMatch) {
        setClientName(nameMatch[1]);
        setEmailAddress(`${nameMatch[1].toLowerCase().replace(/\s+/g, '')}@gmail.com`);
      }

      // Extract Contact Number
      const contactMatch = text.match(/(09\d{9}|\+63\s?9\d{2}\s?\d{3}\s?\d{4})/);
      if (contactMatch) {
        setContactNumber(contactMatch[0]);
      }

      // Extract Package Type
      if (text.toLowerCase().includes('4d3n') || text.toLowerCase().includes('el nido')) {
        setTourPackage('El Nido 4D3N Complete Island Adventure');
      } else if (text.toLowerCase().includes('tour b')) {
        setTourPackage('El Nido Island Hopping Tour B with Lunch');
      }

      setIsParsing(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const refNo = `Q-${Math.floor(10000 + Math.random() * 90000)}`;
      const totalAmount = headcount * 3500;

      const { error } = await supabase.from('quotations').insert([
        {
          reference_no: refNo,
          client_name: clientName || 'Valued Client',
          client_email: emailAddress || 'client@example.com',
          client_contact: contactNumber || '+63 912 345 6789',
          package_name: tourPackage,
          pax: headcount,
          total_amount: totalAmount,
          status: 'Draft',
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      
      // Trigger success modal
      setSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSuccessModal(false);
    router.push('/admin/quotation');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 font-sans text-slate-900 bg-white space-y-8 relative">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Manual Entry & AI Parser
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Create New Quotation</h1>
          <p className="text-sm text-slate-600">Paste client inquiries into the AI parser below to automatically populate booking details for review.</p>
        </div>
        <Link
          href="/admin/quotation"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl transition-all"
        >
          ← Back to Records
        </Link>
      </div>

      {/* Error Alert Display */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          <strong>Error saving quotation:</strong> {errorMessage}
        </div>
      )}

      {/* AI Quotation Parser Workspace Card */}
      <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg"></span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">AI Quotation Parser</h3>
        </div>
        <p className="text-xs text-slate-600">
          Paste your client's raw chat message or inquiry below. Click <strong>Run AI Parser</strong> to instantly extract client info and schedule details into the verification form.
        </p>
        <form onSubmit={handleAiParse} className="space-y-3">
          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Hi po, pa-quote sana kami ng 4D3N elnydo tour para sa paks 6 namin nina Maria Santos..."
            className="w-full text-xs p-3.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 shadow-sm"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isParsing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isParsing ? 'Extracting Details...' : ' Run AI Parser'}
            </button>
          </div>
        </form>
      </div>

      {/* Booking Details & Client Information Verification Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Client Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="e.g. maria.santos@gmail.com"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 09189998877"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                required
              />
            </div>
          </div>
        </div>

        {/* Tour & Schedule Details Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tour & Schedule Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Tour Package</label>
              <select
                value={tourPackage}
                onChange={(e) => setTourPackage(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
              >
                <option value="El Nido Island Hopping Tour A with Lunch">El Nido Island Hopping Tour A with Lunch</option>
                <option value="El Nido Island Hopping Tour B with Lunch">El Nido Island Hopping Tour B with Lunch</option>
                <option value="El Nido 4D3N Complete Island Adventure">El Nido Island Hopping Tour C with Lunch</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tour Date</label>
                <input
                  type="date"
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headcount (Pax)</label>
                <input
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/quotation"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Quotation...' : 'Save Quotation Record'}
          </button>
        </div>
      </form>

      {/* Success Modal matching the exact reference style */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full mx-4 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Green Check Icon */}
            <div className="w-20 h-20 border-4 border-emerald-600 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl">
              ✓
            </div>
            
            {/* Success Title */}
            <h3 className="text-xl font-bold text-slate-800">
              Success
            </h3>
            
            {/* Description */}
            <p className="text-xs text-slate-500 leading-relaxed px-2">
              Quotation successfully saved and recorded.
            </p>
            
            {/* Centered Ok Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleModalClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}