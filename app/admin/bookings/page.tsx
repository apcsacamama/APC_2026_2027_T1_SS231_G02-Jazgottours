'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiEye, 
  FiLock,
  FiMapPin,
  FiUser,
  FiRefreshCw,
  FiFrown
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

export default function BookingsPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Booking for Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Success / Error Modal Popup State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    subMessage?: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    subMessage: ''
  });

  useEffect(() => {
    checkUserAndFetchBookings();
  }, []);

  const checkUserAndFetchBookings = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email || null;
      setCurrentUserEmail(email);

      if (email === 'admin@jazgottours.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      await fetchBookings();
    } catch (err: any) {
      console.error('Error verifying auth:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus } as any)
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }

      // Close details modal and trigger matching Success Modal
      const actionText = newStatus === 'confirmed' ? 'approved & confirmed' : 'cancelled';
      setSelectedBooking(null);
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'SUCCESS',
        message: `Booking #${bookingId.slice(0, 8)} has been successfully ${actionText}.`,
        subMessage: 'The booking record has been updated in your system.'
      });

    } catch (err: any) {
      // Trigger matching Error Modal
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'ERROR!',
        message: 'We were unable to update the booking status.',
        subMessage: err?.message || 'Please try again to complete the request.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter Logic mapped to tour_package and lead_guest_name
  const filteredBookings = bookings.filter((b) => {
    const searchLower = searchQuery.toLowerCase();
    const guestName = (b.lead_guest_name || b.customer_name || '').toLowerCase();
    const packageTitle = (b.tour_package || b.tour_name || b.destination || '').toLowerCase();
    const email = (b.email || b.user_email || '').toLowerCase();
    const id = (b.id || '').toLowerCase();

    const matchesSearch =
      guestName.includes(searchLower) ||
      packageTitle.includes(searchLower) ||
      email.includes(searchLower) ||
      id.includes(searchLower);

    const matchesStatus =
      statusFilter === 'all' || (b.status || 'pending').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'confirmed' || s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] border border-emerald-200">
          <FiCheckCircle size={12} />
          Confirmed
        </span>
      );
    }
    if (s === 'cancelled' || s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-[11px] border border-rose-200">
          <FiXCircle size={12} />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md text-[11px] border border-amber-200">
        <FiClock size={12} />
        Pending
      </span>
    );
  };

  if (loadingUser) {
    return <div className="p-10 text-center text-slate-500">Verifying administrator credentials...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiLock size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Restricted Access Area</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Bookings management is strictly reserved for the primary owner (<span className="font-semibold text-slate-700">admin@jazgottours.com</span>). You are currently logged in as <span className="font-semibold text-slate-700">{currentUserEmail || 'Guest'}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans text-slate-900 space-y-8 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Tour & Travel Operations
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Bookings Directory</h1>
          <p className="text-sm text-slate-600">Manage  tour reservations</p>
        </div>
        <div className="flex items-center gap-2">

        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search lead guest, package..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <FiFilter size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Reservation Log</h3>
          <span className="text-xs text-slate-500 font-semibold">{filteredBookings.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Client Name</th>
                <th className="p-4">Tour Package</th>
                <th className="p-4">Pax</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Loading booking records from Supabase...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b: any) => {
                  const userEmail = b.email || b.user_email;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[11px]">
                            <FiUser size={12} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{b.lead_guest_name || b.customer_name || 'Guest User'}</p>
                            {userEmail && (
                              <p className="text-[11px] text-slate-400 font-normal">{userEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FiMapPin size={12} className="text-amber-700" />
                          <span>{b.tour_package || b.tour_name || 'Custom Package'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {b.pax || b.guests || b.guests_count || 1}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar size={12} className="text-slate-400" />
                          <span>
                            {b.tour_date || b.travel_date || b.created_at
                              ? new Date(b.tour_date || b.travel_date || b.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(b.status)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="text-amber-700 hover:text-amber-900 p-1.5 rounded-lg hover:bg-amber-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <FiEye size={14} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                  ID: #{selectedBooking.id?.slice(0, 8) || 'N/A'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Booking Overview</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50/80 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lead Guest</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBooking.lead_guest_name || 'Guest'}</p>
                {(selectedBooking.email || selectedBooking.user_email) && (
                  <p className="text-slate-500 text-[11px]">{selectedBooking.email || selectedBooking.user_email}</p>
                )}
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Party Size</span>
                <p className="font-bold text-amber-800 text-sm">{selectedBooking.pax || selectedBooking.guests || 1}</p>
                <p className="text-slate-500 text-[11px]">Total Pax</p>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl space-y-1 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tour Package</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBooking.tour_package || 'Custom Tour'}</p>
                <p className="text-slate-500 text-[11px]">
                  Date: {selectedBooking.tour_date || selectedBooking.travel_date ? new Date(selectedBooking.tour_date || selectedBooking.travel_date).toDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Current Status Badge inside modal */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Current Status:</span>
              {getStatusBadge(selectedBooking.status)}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Update Booking Status</label>
              <div className="flex gap-3">
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Approve / Confirm'}
                </button>
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Cancel Booking'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS / ERROR Modal matching design reference */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Icon */}
            <div className="flex justify-center">
              {feedbackModal.type === 'success' ? (
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center">
                  <FiCheckCircle size={38} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-rose-500 text-rose-500 flex items-center justify-center">
                  <FiFrown size={38} />
                </div>
              )}
            </div>

            {/* Title */}
            <h3
              className={`text-sm font-extrabold uppercase tracking-widest ${
                feedbackModal.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {feedbackModal.title}
            </h3>

            {/* Content Text */}
            <div className="space-y-1.5 text-xs text-slate-600 font-medium px-2">
              <p>{feedbackModal.message}</p>
              {feedbackModal.subMessage && (
                <p className="text-slate-400 text-[11px]">{feedbackModal.subMessage}</p>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
                className={`w-full py-2.5 rounded-md text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
                  feedbackModal.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {feedbackModal.type === 'success' ? 'Continue' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}