'use client';

import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShield, FiEdit2, FiCheck, FiLock, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { createStaffAccount } from './actions';

export default function ClientsPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerUsername, setOwnerUsername] = useState('Jasmine');
  const [ownerEmail, setOwnerEmail] = useState('admin@jazgottours.com');
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  const [staffAccounts, setStaffAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Delete Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  useEffect(() => {
    checkUserAndFetchData();
  }, []);

  const checkUserAndFetchData = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email || null;
      setCurrentUserEmail(email);

      if (email === 'admin@jazgottours.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      await fetchOwnerProfile();
      await fetchStaffAccounts();
    } catch (err) {
      console.error('Error checking authorization:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchOwnerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@jazgottours.com')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOwnerId(data.id || null);
        setOwnerUsername(data.username || 'Jasmine');
        setOwnerEmail(data.email || 'admin@jazgottours.com');
      }
    } catch (err: any) {
      console.error('Error fetching owner profile:', err?.message || err);
    }
  };

  const handleSaveOwner = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      if (ownerId) {
        const updateData = { username: ownerUsername, email: ownerEmail };
        const { error } = await supabase
          .from('profiles')
          .update(updateData as any)
          .eq('id', ownerId);

        if (error) throw error;
      } else {
        const payload = { 
          username: ownerUsername, 
          email: ownerEmail, 
          role: 'owner' 
        };
        const { error } = await supabase
          .from('profiles')
          .insert([payload as any]);

        if (error) throw error;
      }
      setIsEditingOwner(false);
    } catch (err: any) {
      alert('Error updating owner profile: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('email', 'eq', 'admin@jazgottours.com')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching staff accounts:', err?.message || err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const result = await createStaffAccount(null, formData);

    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'An error occurred during registration.');
    } else {
      setIsModalOpen(false);
      await fetchStaffAccounts();
    }
  };

  const confirmDeleteAccount = async () => {
    if (!isAdmin || !userToDelete) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
      if (error) throw error;

      setStaffAccounts(staffAccounts.filter((acc) => acc.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: any) {
      alert(`Error deleting account: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return <div className="p-10 text-center text-slate-500">Verifying authorization credentials...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiLock size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Restricted Access Area</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Account management is strictly reserved for the primary owner (<span className="font-semibold text-slate-700">admin@jazgottours.com</span>). You are currently logged in as <span className="font-semibold text-slate-700">{currentUserEmail || 'Guest'}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans text-slate-900 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Restricted Administrator Zone
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Staff Account Management</h1>
          <p className="text-sm text-slate-600">Exclusive access: Managing credentials for internal team members</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <UserPlusIcon />
          <span>+ Add Staff Account</span>
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-amber-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {ownerUsername && ownerUsername.length > 0 ? ownerUsername.charAt(0) : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Primary Owner Profile</h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">Master Admin</span>
              </div>
              <p className="text-xs text-slate-500">{ownerEmail}</p>
            </div>
          </div>
          <div>
            {!isEditingOwner ? (
              <button
                onClick={() => setIsEditingOwner(true)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <FiEdit2 size={13} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleSaveOwner}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <FiCheck size={13} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Owner Username</label>
            {isEditingOwner ? (
              <input
                type="text"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            ) : (
              <p className="text-xs font-bold text-slate-900 py-2">{ownerUsername}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Owner Email Address</label>
            {isEditingOwner ? (
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            ) : (
              <p className="text-xs font-bold text-slate-900 py-2">{ownerEmail}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Staff Accounts Directory</h3>
            <p className="text-[11px] text-slate-400">All registered staff members & sales agents</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{staffAccounts.length} accounts found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Username</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Date Added</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No other staff accounts found in the system.
                  </td>
                </tr>
              ) : (
                staffAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px]">
                        {account.username && account.username.length > 0 ? account.username.charAt(0) : 'S'}
                      </div>
                      {account.username}
                    </td>
                    <td className="p-4 text-slate-600">{account.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                        <FiShield size={12} className="text-amber-700" />
                        {account.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {account.created_at ? new Date(account.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setUserToDelete(account)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                        title="Revoke and Delete"
                      >
                        <FiTrash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Add Staff Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. staffmember"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="staff@jazgottours.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Temporary Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Role / Permissions</label>
                <select
                  name="role"
                  defaultValue="staff"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white text-slate-900"
                >
                  <option value="staff">Staff</option>
                  <option value="sales_agent">Sales Agent</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-5">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FiAlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Revoke & Delete Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-slate-800">{userToDelete.username}</span> (<span className="text-slate-600">{userToDelete.email}</span>)?
              </p>
              <p className="text-[11px] text-rose-600 font-medium bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-100 mt-2">
                This action cannot be undone and will revoke access immediately.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={loading}
                className="w-1/2 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={loading}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}