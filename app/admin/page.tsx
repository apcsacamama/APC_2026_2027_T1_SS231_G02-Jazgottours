'use client';
import Link from 'next/link';
import { FiFileText, FiDollarSign, FiUsers, FiPlus, FiArrowRight } from 'react-icons/fi';

export default function AdminHomePage() {
  const recentQuotations = [
    { client: 'Maria Santos', date: 'Aug 27, 2026', amount: '₱4,500', status: 'Pending' },
    { client: 'Juan Dela Cruz', date: 'Aug 26, 2026', amount: '₱7,200', status: 'Sent' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 p-6">
      {/* Top Header Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Owner & Sales Workspace</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Welcome Back, Jasmine!</h1>
          <p className="text-sm text-gray-600">Here is the quick overview of your sales and marketing activities.</p>
        </div>
        
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Quotations Made */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quotations Made</span>
            <h2 className="text-3xl font-extrabold text-gray-900">24</h2>
            <Link href="/admin/quotation/records" className="inline-flex items-center gap-1 text-xs font-semibold text-[#c89134] hover:underline pt-2">
              View quotations <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="p-3 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60">
            <FiFileText size={22} />
          </div>
        </div>

        {/* Card 2: Invoices Made */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Invoices Made</span>
            <h2 className="text-3xl font-extrabold text-gray-900">18</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c89134] hover:underline pt-2 cursor-pointer">
              View invoices <FiArrowRight size={12} />
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60">
            <FiDollarSign size={22} />
          </div>
        </div>

        {/* Card 3: Client Contacts */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client Contacts</span>
            <h2 className="text-3xl font-extrabold text-gray-900">35</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c89134] hover:underline pt-2 cursor-pointer">
              View client list <FiArrowRight size={12} />
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-[#c89134] rounded-xl border border-amber-200/60">
            <FiUsers size={22} />
          </div>
        </div>
      </div>

      {/* Recent Quotations Table Card */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-amber-100 flex justify-between items-center bg-[#fcfbf9]/50">
          <h3 className="font-bold text-gray-900 text-base">Recent Quotations</h3>
          <Link href="/admin/quotation/records" className="text-xs font-semibold text-[#c89134] hover:underline">
            Manage all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-6">Client Name</th>
                <th className="py-3 px-6">Date Created</th>
                <th className="py-3 px-6">Total Amount</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentQuotations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-semibold text-gray-900">{row.client}</td>
                  <td className="py-4 px-6 text-gray-600">{row.date}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{row.amount}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'Pending'
                          ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200/60'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}