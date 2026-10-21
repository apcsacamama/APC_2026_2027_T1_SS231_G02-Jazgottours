"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiPackage, 
  FiCalendar, 
  FiLogOut 
} from 'react-icons/fi';
import { Logo } from '@/components/logo';
import { supabase } from '@/lib/supabase';
import { 
  getActiveAgent, 
  syncActiveAgentFromUser, 
  AgentProfile 
} from '@/lib/agent-service';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [activeAgent, setActiveAgentState] = useState<AgentProfile>(() => getActiveAgent());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSessionAndSync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const localEmail = typeof window !== 'undefined' ? localStorage.getItem('jazgot_user_email') : null;
      const localRole = typeof window !== 'undefined' ? localStorage.getItem('jazgot_user_role') : null;

      if (!session && !localEmail) {
        setLoading(false);
        router.push('/signin');
        return;
      }

      // Staff accounts can ONLY access the Staff/Admin dashboard
      if (localRole === 'staff') {
        setLoading(false);
        router.replace('/admin');
        return;
      }

      if (session?.user) {
        const profile = syncActiveAgentFromUser(session.user);
        setActiveAgentState(profile);
      } else {
        setActiveAgentState(getActiveAgent());
      }
      setLoading(false);
    };

    checkSessionAndSync();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/signin');
      } else if (session?.user) {
        const profile = syncActiveAgentFromUser(session.user);
        setActiveAgentState(profile);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jazgot_user_role');
      localStorage.removeItem('jazgot_user_first_name');
      localStorage.removeItem('jazgot_user_email');
      localStorage.removeItem('jazgot_active_agent');
    }
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f1ea]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dfa241]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f4f1ea] font-sans antialiased text-slate-800 overflow-hidden">
      {/* Agent Sidebar with Rich Mustard-Amber Glass & Soft Multi-Stop Gradient */}
      <aside className="w-72 bg-gradient-to-b from-[#eadecb] via-[#e5cfb1] to-[#d6b589] backdrop-blur-xl text-slate-800 flex flex-col justify-between hidden md:flex border-r border-[#c29d6d]/40 shadow-[0_8px_30px_rgb(180,130,60,0.12)] relative overflow-hidden">
        
        {/* Soft atmospheric gradient glows behind the glass */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-gradient-to-br from-[#dfa241]/30 to-[#c88422]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-12 -right-12 w-44 h-44 bg-gradient-to-tl from-[#e3af58]/25 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          {/* Brand Header */}
          <div className="px-6 py-7 border-b border-[#c29d6d]/30 bg-white/30 backdrop-blur-md">
            <Logo className="h-10" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-amber-900 font-extrabold tracking-widest uppercase bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300/60">
                Tour Agent Portal
              </span>
              <span className="text-[10px] font-bold text-slate-600">ID: {activeAgent.code}</span>
            </div>
          </div>

          {/* Navigation Cards */}
          <nav className="mt-5 px-4 space-y-1.5 text-sm font-medium">
            <Link 
              href="/agent" 
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all border shadow-[0_2px_12px_rgb(150,100,30,0.04)] group ${
                pathname === '/agent'
                  ? 'bg-white text-slate-950 border-[#c29d6d] font-bold shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 border-white/60 hover:border-[#c29d6d]/60'
              }`}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiHome size={15} />
              </div> 
              <span className="tracking-wide">Agent Dashboard</span>
            </Link>

            <Link 
              href="/agent/products" 
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all border shadow-[0_2px_12px_rgb(150,100,30,0.04)] group ${
                pathname.startsWith('/agent/products')
                  ? 'bg-white text-slate-950 border-[#c29d6d] font-bold shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 border-white/60 hover:border-[#c29d6d]/60'
              }`}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiPackage size={15} />
              </div> 
              <div className="flex flex-col">
                <span className="tracking-wide">Services & Mark-up</span>
                <span className="text-[10px] text-amber-800 font-semibold">Net Cost Protected</span>
              </div>
            </Link>

            <Link 
              href="/agent/bookings" 
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all border shadow-[0_2px_12px_rgb(150,100,30,0.04)] group ${
                pathname === '/agent/bookings'
                  ? 'bg-white text-slate-950 border-[#c29d6d] font-bold shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 border-white/60 hover:border-[#c29d6d]/60'
              }`}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiCalendar size={15} />
              </div> 
              <span className="tracking-wide">My Client Bookings</span>
            </Link>
          </nav>
        </div>

        {/* Agent Profile & Exit Actions */}
        <div className="p-4 border-t border-[#c29d6d]/30 bg-white/30 backdrop-blur-md relative z-10 space-y-3">
          {/* Active Logged-in Agent Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 uppercase">
              {activeAgent.name.charAt(0)}
            </div>
            <div className="text-left truncate">
              <p className="font-bold text-slate-900 text-xs truncate capitalize">{activeAgent.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{activeAgent.email}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#3d2e1b] hover:bg-[#261d11] active:scale-[0.98] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all text-amber-100 shadow-sm cursor-pointer"
          >
            <FiLogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/70 backdrop-blur-md shadow-xs px-6 sm:px-8 py-3.5 flex justify-between items-center border-b border-amber-200/50 z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-700">
                Tour Agent Workspace
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                5% Admin Commission Synced
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 capitalize">{activeAgent.name}</p>
              <p className="text-[10px] text-slate-400">{activeAgent.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
              {activeAgent.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f5f2eb]">
          {children}
        </main>
      </div>
    </div>
  );
}
