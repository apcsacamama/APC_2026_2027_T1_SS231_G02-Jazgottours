'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiTrash2, 
  FiShield, 
  FiEdit2, 
  FiCheck, 
  FiLock, 
  FiAlertTriangle, 
  FiUserCheck, 
  FiBriefcase, 
  FiKey, 
  FiMail, 
  FiExternalLink,
  FiPlus,
  FiRefreshCw
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { createUserAccount, deleteUserAccount } from './actions';
import { AppRole, ROLE_DOMAINS, ROLE_LABELS, generateDefaultEmail } from '@/lib/user-roles';

interface AccountRecord {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: AppRole;
  created_at?: string;
}

export default function ClientsPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Primary Admin Owner state
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerUsername, setOwnerUsername] = useState('Jasmine');
  const [ownerEmail, setOwnerEmail] = useState('admin@jazgottours.com');
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  // Accounts list state
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields State for Add User Modal
  const [selectedRole, setSelectedRole] = useState<AppRole>('staff');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  // Delete Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<AccountRecord | null>(null);

  useEffect(() => {
    checkUserAndFetchData();
  }, []);

  const checkUserAndFetchData = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;
      const email = sessionUser?.email || null;
      setCurrentUserEmail(email);

      const roleMeta = sessionUser?.user_metadata?.role;
      const isOwnerOrAdmin = email === 'admin@jazgottours.com' || roleMeta === 'admin';
      setIsAdmin(isOwnerOrAdmin);

      await fetchOwnerProfile();
      await fetchAllAccounts();
    } catch (err) {
      console.error('Error checking authorization:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchOwnerProfile = async () => {
    try {
      // 1. Try 'user' table first
      const { data: userRow } = await supabase
        .from('user')
        .select('*')
        .eq('email', 'admin@jazgottours.com')
        .maybeSingle();

      if (userRow) {
        setOwnerId(userRow.id || null);
        setOwnerUsername(userRow.full_name || 'Jasmine');
        setOwnerEmail(userRow.email || 'admin@jazgottours.com');
        return;
      }

      // 2. Fallback to profiles table
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@jazgottours.com')
        .maybeSingle();

      if (profileRow) {
        setOwnerId(profileRow.id || null);
        setOwnerUsername(profileRow.username || profileRow.full_name || 'Jasmine');
        setOwnerEmail(profileRow.email || 'admin@jazgottours.com');
      }
    } catch (err: any) {
      console.error('Error fetching owner profile:', err?.message || err);
    }
  };

  const fetchAllAccounts = async () => {
    setFetchingList(true);
    try {
      // 1. Fetch from 'user' table
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('*')
        .not('email', 'eq', 'admin@jazgottours.com')
        .order('created_at', { ascending: false });

      if (!userError && userData && userData.length > 0) {
        const mapped: AccountRecord[] = userData.map((u: any) => ({
          id: u.id,
          email: u.email,
          username: u.full_name || u.username || u.email.split('@')[0],
          full_name: u.full_name,
          role: (u.role || 'staff') as AppRole,
          created_at: u.created_at,
        }));
        setAccounts(mapped);
        return;
      }

      // 2. Fallback to 'profiles' table if available
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .not('email', 'eq', 'admin@jazgottours.com')
        .order('created_at', { ascending: false });

      if (profileData && profileData.length > 0) {
        const mapped: AccountRecord[] = profileData.map((p: any) => ({
          id: p.id,
          email: p.email,
          username: p.username || p.full_name || p.email.split('@')[0],
          full_name: p.full_name || p.username,
          role: (p.role || 'staff') as AppRole,
          created_at: p.created_at,
        }));
        setAccounts(mapped);
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err?.message || err);
    } finally {
      setFetchingList(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const payload = {
        full_name: ownerUsername,
        email: ownerEmail,
        role: 'admin',
        updated_at: new Date().toISOString(),
      };

      await supabase.from('user').upsert(payload, { onConflict: 'email' });
      await supabase.from('profiles').upsert({ username: ownerUsername, email: ownerEmail, role: 'admin' });

      setIsEditingOwner(false);
    } catch (err: any) {
      alert('Error updating owner profile: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Helper when modal opens
  const openAddUserModal = () => {
    setSelectedRole('staff');
    setUsernameInput('');
    setEmailInput(generateDefaultEmail('', 'staff'));
    setPasswordInput('');
    setIsEmailManuallyEdited(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // When Role changes in the modal
  const handleRoleChange = (newRole: AppRole) => {
    setSelectedRole(newRole);
    // If admin hasn't typed a completely custom email domain, update domain suffix automatically
    if (!isEmailManuallyEdited) {
      setEmailInput(generateDefaultEmail(usernameInput, newRole));
    } else {
      // If manually edited, preserve the prefix before '@' and append the new role domain
      const prefix = emailInput.split('@')[0] || usernameInput || 'user';
      setEmailInput(`${prefix}${ROLE_DOMAINS[newRole]}`);
    }
  };

  // When Username changes in the modal
  const handleUsernameChange = (val: string) => {
    setUsernameInput(val);
    if (!isEmailManuallyEdited) {
      setEmailInput(generateDefaultEmail(val, selectedRole));
    }
  };

  // When Email changes in the modal (Admin can freely edit anytime!)
  const handleEmailChange = (val: string) => {
    setEmailInput(val);
    setIsEmailManuallyEdited(true);
  };

  // Reset email to default role format helper button
  const handleResetEmailFormat = () => {
    const formatted = generateDefaultEmail(usernameInput, selectedRole);
    setEmailInput(formatted);
    setIsEmailManuallyEdited(false);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('username', usernameInput);
    formData.append('email', emailInput);
    formData.append('password', passwordInput);
    formData.append('role', selectedRole);

    const result = await createUserAccount(null, formData);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create user account.');
    } else {
      setIsModalOpen(false);
      await fetchAllAccounts();
    }
  };

  const confirmDeleteAccount = async () => {
    if (!isAdmin || !userToDelete) return;
    setLoading(true);

    try {
      const result = await deleteUserAccount(userToDelete.id, userToDelete.email);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }

      setAccounts((prev) => prev.filter((acc) => acc.id !== userToDelete.id && acc.email !== userToDelete.email));
      setUserToDelete(null);
    } catch (err: any) {
      alert(`Error deleting account: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 gap-2">
        <FiRefreshCw className="animate-spin" size={18} />
        <span className="text-sm font-medium">Verifying administrator authorization...</span>
      </div>
    );
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Restricted Administrator Zone
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Users & Role Management</h1>
          <p className="text-sm text-slate-600">
            Set and manage credentials for Staff and Tour Agents with role-specific dashboard access
          </p>
        </div>
        <button
          onClick={openAddUserModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <FiPlus size={16} />
          <span>+ Add New User</span>
        </button>
      </div>

      {/* Role Domain Guidelines Alert */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <FiShield size={18} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Role Domain Conventions</h4>
            <p className="text-xs text-slate-600">
              Accounts created for Staff default to <code className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">@staff.jgt.com</code> (Operations Dashboard), and Agents default to <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">@agent.jgt.com</code> (Tour Agent Portal). You can freely edit any email format.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] shrink-0 font-semibold">
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg">Staff &rarr; /admin</span>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">Agent &rarr; /agent</span>
        </div>
      </div>

      {/* Primary Owner Profile Card */}
      <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-amber-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {ownerUsername && ownerUsername.length > 0 ? ownerUsername.charAt(0) : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Primary Master Admin</h3>
                <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-purple-200">
                  Full Authority
                </span>
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Master Username</label>
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Master Email Address</label>
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

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Users & Accounts Directory</h3>
            <p className="text-[11px] text-slate-400">All managed staff members and sales agents in Supabase</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllAccounts}
              disabled={fetchingList}
              className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold cursor-pointer p-1"
              title="Refresh users directory"
            >
              <FiRefreshCw className={fetchingList ? 'animate-spin' : ''} size={13} />
              <span>Refresh</span>
            </button>
            <span className="text-xs text-slate-500 font-semibold bg-slate-200/60 px-2.5 py-1 rounded-full">
              {accounts.length} accounts found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Name / Username</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Permitted Dashboard</th>
                <th className="p-4">Date Added</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    {fetchingList ? 'Loading accounts...' : 'No other user accounts found in the system yet. Click "+ Add New User" above to create one.'}
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const roleConfig = ROLE_LABELS[account.role] || ROLE_LABELS.staff;
                  const isAgent = account.role === 'agent';
                  return (
                    <tr key={account.id || account.email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-2xs ${
                          isAgent ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {account.username && account.username.length > 0 ? account.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{account.username}</div>
                          {account.full_name && account.full_name !== account.username && (
                            <div className="text-[10px] text-slate-400">{account.full_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-[11px]">
                        {account.email}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-md text-[11px] border ${roleConfig.badge}`}>
                          {isAgent ? <FiBriefcase size={12} /> : <FiUserCheck size={12} />}
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                          isAgent ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}>
                          {roleConfig.dashboard}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {account.created_at
                          ? new Date(account.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New User Account</h3>
                <p className="text-[11px] text-slate-500">Provision credentials with dedicated role permissions</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <FiAlertTriangle className="shrink-0" size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Role Selection Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select User Role & Target Dashboard
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Staff Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('staff')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === 'staff'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedRole === 'staff' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <FiUserCheck size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Staff</div>
                        <div className="text-[10px] text-blue-700 font-mono font-semibold">@staff.jgt.com</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                      Access to <strong>/admin</strong> (Bookings & Quotations)
                    </div>
                  </button>

                  {/* Agent Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('agent')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === 'agent'
                        ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedRole === 'agent' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <FiBriefcase size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Tour Agent</div>
                        <div className="text-[10px] text-amber-700 font-mono font-semibold">@agent.jgt.com</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                      Access to <strong>/agent</strong> (Agent Tour Portal)
                    </div>
                  </button>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Username / Agent Name
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={usernameInput}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. rio"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900 bg-white"
                />
              </div>

              {/* Email Input (Directly Editable with Domain Helper) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  {isEmailManuallyEdited ? (
                    <button
                      type="button"
                      onClick={handleResetEmailFormat}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                    >
                      Reset to default format (@{selectedRole}.jgt.com)
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Auto-formatted (editable)</span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={emailInput}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={`e.g. rio${ROLE_DOMAINS[selectedRole]}`}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Standard domain: <strong className="font-mono text-slate-700">{ROLE_DOMAINS[selectedRole]}</strong></span>
                  <span className="text-[10px] text-slate-400 italic">You can edit this to any custom format</span>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Temporary Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900 bg-white"
                />
              </div>

              {/* Role & Dashboard Summary Callout */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                selectedRole === 'agent' ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-blue-50/60 border-blue-200 text-blue-900'
              }`}>
                <div className="space-y-0.5">
                  <span className="font-bold">Permitted Dashboard:</span>
                  <p className="text-[11px] text-slate-600">
                    {selectedRole === 'agent'
                      ? 'This email can ONLY log in to and open the Tour Agent Portal (/agent).'
                      : 'This email can ONLY log in to and open the Operations Dashboard (/admin). Restricted from owner/invoices.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-xs px-2 py-1 rounded bg-white shadow-2xs">
                    {selectedRole === 'agent' ? '/agent' : '/admin'}
                  </span>
                </div>
              </div>

              {/* Actions */}
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
                This action cannot be undone and will revoke access immediately from the dashboard.
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