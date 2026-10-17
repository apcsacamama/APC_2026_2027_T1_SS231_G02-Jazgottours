"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiPackage, 
  FiCalendar, 
  FiFileText, 
  FiUsers, 
  FiLogOut, 
  FiTrendingUp, 
  FiLock,
  FiShield,
  FiBriefcase,
  FiUserCheck,
  FiArrowLeft
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/logo';
import { formatFirstName } from '@/lib/agent-service';

type Role = 'admin' | 'staff' | 'agent';

interface NavItem {
  title: string;
  href: string;
  icon?: any;
  isPesoIcon?: boolean;
  allowedRoles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: FiHome,
    allowedRoles: ['admin', 'staff'],
  },
  {
    title: 'Services',
    href: '/admin/products',
    icon: FiPackage,
    allowedRoles: ['admin', 'staff'],
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: FiCalendar,
    allowedRoles: ['admin', 'staff'], // Admin & Staff access
  },
  {
    title: 'Quotation',
    href: '/admin/quotation',
    icon: FiFileText,
    allowedRoles: ['admin', 'staff'],
  },
  {
    title: 'Invoices',
    href: '/admin/invoices',
    isPesoIcon: true,
    allowedRoles: ['admin'], // Admin exclusive
  },
  {
    title: 'Commissions',
    href: '/admin/commisions',
    icon: FiTrendingUp,
    allowedRoles: ['admin'], // Admin exclusive (Staff strictly excluded)
  },
  {
    title: 'Users',
    href: '/admin/clients',
    icon: FiUsers,
    allowedRoles: ['admin'], // Admin exclusive
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>('admin');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const localEmail = typeof window !== 'undefined' ? localStorage.getItem('jazgot_user_email') : null;
      const localRole = typeof window !== 'undefined' ? (localStorage.getItem('jazgot_user_role') as Role) : null;
      const localName = typeof window !== 'undefined' ? localStorage.getItem('jazgot_user_first_name') : null;

      // If no session and no stored credentials, user is unauthenticated — redirect to unified sign-in
      if (!session && !localEmail) {
        setLoading(false);
        router.replace('/signin');
        return;
      }

      const email = session?.user?.email || localEmail;
      if (email) {
        setUserEmail(email);

        const nameMeta = session?.user?.user_metadata?.given_name ||
                         session?.user?.user_metadata?.first_name ||
                         session?.user?.user_metadata?.full_name ||
                         session?.user?.user_metadata?.name ||
                         localName;
        const derivedFirst = formatFirstName(nameMeta || email);
        setUserName(derivedFirst);

        // Role resolution: metadata > localStorage > default admin
        let role = (session?.user?.user_metadata?.role as Role) || localRole || undefined;

        if (!role) {
          // All portal accounts share @jazgottours.com;
          // role is always stored in metadata or localStorage.
          role = 'admin';
        }

        // Agents do NOT have access to admin dashboard - redirect immediately to their own dashboard
        if (role === 'agent') {
          router.replace('/agent');
          return;
        }

        setUserRole(role);
      }

      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserEmail(null);
      } else if (session?.user?.email) {
        const role = session.user.user_metadata?.role as Role | undefined;
        if (role) {
          if (role === 'agent') {
            router.replace('/agent');
            return;
          }
          setUserRole(role);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jazgot_user_role');
      localStorage.removeItem('jazgot_user_first_name');
      localStorage.removeItem('jazgot_user_email');
      localStorage.removeItem('jazgot_pending_role');
      localStorage.removeItem('jazgot_active_agent');
    }
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserName(null);
    window.location.href = '/signin';
  };

  // Show themed loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f1ea]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dfa241]"></div>
      </div>
    );
  }

  // If unauthenticated (shouldn't reach here due to redirect above, but as safety net)
  if (!userEmail) {
    return null;
  }

  // Check if current route is allowed for the user's role
  const currentNav = NAV_ITEMS.find(item => item.href === pathname);
  const isUnauthorized = currentNav && !currentNav.allowedRoles.includes(userRole);

  const displayName = userName || (userEmail ? formatFirstName(userEmail) : 'User');
  const roleBadgeConfig = {
    admin: { label: 'Administrator', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: FiShield },
    staff: { label: 'Staff Member', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: FiUserCheck },
    agent: { label: 'Tour Agent', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: FiBriefcase },
  }[userRole];

  const RoleIcon = roleBadgeConfig.icon;

  return (
    <div className="flex h-screen bg-[#f4f1ea] font-sans antialiased text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-gradient-to-b from-[#eadecb] via-[#e5cfb1] to-[#d6b589] backdrop-blur-xl text-slate-800 flex flex-col justify-between hidden md:flex border-r border-[#c29d6d]/40 shadow-[0_8px_30px_rgb(180,130,60,0.12)] relative overflow-hidden">

        {/* Atmospheric ambient glows */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-gradient-to-br from-[#dfa241]/30 to-[#c88422]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-12 -right-12 w-44 h-44 bg-gradient-to-tl from-[#e3af58]/25 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          {/* Brand Header */}
          <div className="px-6 py-6 border-b border-[#c29d6d]/30 bg-white/30 backdrop-blur-md">
            <Logo className="h-10" />
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${roleBadgeConfig.bg}`}>
                <RoleIcon size={10} />
                {roleBadgeConfig.label}
              </span>
            </div>
          </div>

          {/* Navigation Items (Role Filtered) */}
          <nav className="mt-5 px-4 space-y-1.5 text-sm font-medium overflow-y-auto max-h-[calc(100vh-220px)]">
            {NAV_ITEMS.filter(item => item.allowedRoles.includes(userRole)).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-white/90 text-slate-950 font-bold border border-[#c29d6d] shadow-[0_3px_15px_rgb(150,100,30,0.08)] scale-[1.01]'
                      : 'text-slate-700 hover:text-slate-950 bg-white/40 hover:bg-white/70 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/50'
                  } group`}
                >
                  <div className={`p-2 rounded-xl text-white transition-all shadow-xs flex items-center justify-center w-8 h-8 ${
                    isActive 
                    ? 'bg-gradient-to-br from-[#dfa241] to-[#b37016]' 
                    : 'bg-gradient-to-br from-[#dfa241]/80 to-[#bf7b20]/80 group-hover:from-[#dfa241] group-hover:to-[#bf7b20]'
                  }`}>
                    {item.isPesoIcon ? (
                      <span className="font-black text-sm">₱</span>
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className="tracking-wide text-xs font-semibold">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Exit / Sign Out Footer */}
        <div className="p-4 border-t border-[#c29d6d]/30 bg-white/30 backdrop-blur-md relative z-10 space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#3d2e1b] hover:bg-[#261d11] active:scale-[0.98] rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-amber-100 shadow-md border border-amber-900/30 cursor-pointer"
          >
            <FiLogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white/70 backdrop-blur-md shadow-xs px-6 sm:px-8 py-3.5 flex justify-between items-center border-b border-amber-200/50 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 hidden sm:inline">
              {userRole === 'admin' ? 'Owner & Admin Workspace' : userRole === 'staff' ? 'Staff Operations Workspace' : 'Tour Agent Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 capitalize flex items-center gap-1.5 justify-end">
                <span>{displayName}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${roleBadgeConfig.bg}`}>
                  {userRole}
                </span>
              </p>
              <p className="text-[10px] text-slate-400">Active Session</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shadow-xs uppercase">
              {displayName.slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f5f2eb]">
          {isUnauthorized ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 shadow-md border border-amber-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                <FiLock size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Restricted Tab</h2>
                <p className="text-xs text-slate-500 mt-1">
                  This section ({currentNav?.title}) is restricted to Administrator access only. Your current role is <strong>{roleBadgeConfig.label}</strong>.
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                <FiArrowLeft size={14} /> Back to Dashboard
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}