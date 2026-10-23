import { supabase } from '@/lib/supabase';

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  defaultMarkup: number; // in PHP
}

export interface AgentBooking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  tour_package: string;
  package_id?: number | string;
  pax: number;
  tour_date: string;
  is_agent_booking: boolean;
  agent_id: string;
  agent_name: string;
  agent_email: string;
  base_price_per_pax: number; // Hidden from agent in UI
  markup_per_pax: number;
  total_price_per_pax: number;
  total_amount: number;
  agent_earnings: number; // Markup * Pax
  admin_commission: number; // 5% of base or total
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  created_at: string;
}

export const REGISTERED_AGENTS: AgentProfile[] = [
  {
    id: 'ag-01',
    name: 'Carlos Mendoza',
    email: 'agent.carlos@jazgottours.com',
    phone: '+63 917 555 1201',
    code: 'JAZ-AGT-01',
    defaultMarkup: 500
  },
  {
    id: 'ag-02',
    name: 'Maria Ramos',
    email: 'agent.maria@jazgottours.com',
    phone: '+63 928 444 8822',
    code: 'JAZ-AGT-02',
    defaultMarkup: 600
  },
  {
    id: 'ag-03',
    name: 'Paolo Reyes',
    email: 'agent.paolo@jazgottours.com',
    phone: '+63 919 333 7711',
    code: 'JAZ-AGT-03',
    defaultMarkup: 400
  }
];

/**
 * Look up an agent by referral code via the secure /api/agent-lookup server route.
 * This checks the Supabase user table so ALL admin-created agents are found.
 * Returns null if the code is not recognized.
 */
export async function lookupAgentByCode(code: string): Promise<AgentProfile | null> {
  if (!code?.trim()) return null;

  try {
    const res = await fetch(`/api/agent-lookup?code=${encodeURIComponent(code.trim().toUpperCase())}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.found || !json.agent) return null;
    return {
      id: json.agent.id,
      name: json.agent.name,
      email: json.agent.email,
      code: json.agent.code,
      defaultMarkup: json.agent.defaultMarkup ?? 500,
    };
  } catch {
    return null;
  }
}

const INITIAL_AGENT_BOOKINGS: AgentBooking[] = [
  {
    id: 'AB-2026-001',
    client_name: 'Sophia Taylor & Family',
    client_email: 'sophia.t@gmail.com',
    client_phone: '+63 917 889 0122',
    tour_package: 'El Nido 4D3N Complete Island Adventure',
    package_id: 1,
    pax: 4,
    tour_date: '2026-10-24',
    is_agent_booking: true,
    agent_id: 'ag-01',
    agent_name: 'Carlos Mendoza',
    agent_email: 'agent.carlos@jazgottours.com',
    base_price_per_pax: 6500,
    markup_per_pax: 500,
    total_price_per_pax: 7000,
    total_amount: 28000,
    agent_earnings: 2000,
    admin_commission: 1400, // 5% of 28,000
    status: 'Pending',
    created_at: '2026-10-11T14:30:00Z'
  },
  {
    id: 'AB-2026-002',
    client_name: 'Liam Johnson',
    client_email: 'liam.j@yahoo.com',
    client_phone: '+63 920 112 3344',
    tour_package: 'Tour A with Lunch',
    package_id: 2,
    pax: 2,
    tour_date: '2026-10-18',
    is_agent_booking: true,
    agent_id: 'ag-02',
    agent_name: 'Maria Ramos',
    agent_email: 'agent.maria@jazgottours.com',
    base_price_per_pax: 2400,
    markup_per_pax: 600,
    total_price_per_pax: 3000,
    total_amount: 6000,
    agent_earnings: 1200,
    admin_commission: 300, // 5% of 6,000
    status: 'Confirmed',
    created_at: '2026-10-10T09:15:00Z'
  },
  {
    id: 'AB-2026-003',
    client_name: 'Chloe Zhang',
    client_email: 'chloe.zhang@outlook.com',
    client_phone: '+63 995 876 5432',
    tour_package: 'Coron Island Escape',
    package_id: 3,
    pax: 3,
    tour_date: '2026-10-29',
    is_agent_booking: true,
    agent_id: 'ag-01',
    agent_name: 'Carlos Mendoza',
    agent_email: 'agent.carlos@jazgottours.com',
    base_price_per_pax: 4000,
    markup_per_pax: 500,
    total_price_per_pax: 4500,
    total_amount: 13500,
    agent_earnings: 1500,
    admin_commission: 675, // 5% of 13,500
    status: 'Confirmed',
    created_at: '2026-10-09T16:45:00Z'
  }
];

const STORAGE_KEY_BOOKINGS = 'jazgot_agent_bookings';
const STORAGE_KEY_MARKUPS = 'jazgot_agent_markups';
const STORAGE_KEY_ACTIVE_AGENT = 'jazgot_active_agent';
const STORAGE_KEY_USER_ROLE = 'jazgot_user_role';

export function formatFirstName(input?: string | null): string {
  if (!input) return 'Agent';
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    const username = trimmed.split('@')[0];
    const firstChunk = username.split(/[._-]/)[0];
    return firstChunk ? firstChunk.charAt(0).toUpperCase() + firstChunk.slice(1).toLowerCase() : 'Agent';
  }
  const firstWord = trimmed.split(' ')[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

export function syncActiveAgentFromUser(user: any): AgentProfile {
  if (!user) return getActiveAgent();
  const rawName = user.user_metadata?.given_name || 
                  user.user_metadata?.first_name || 
                  user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email;
  const firstName = formatFirstName(rawName);
  const email = user.email || `${firstName.toLowerCase()}@jazgottours.com`;
  const generatedCode = `JAZ-AGT-${firstName.slice(0, 3).toUpperCase()}`;

  const profile: AgentProfile = {
    id: user.id || `ag-${firstName.toLowerCase()}`,
    name: firstName,
    email: email,
    code: generatedCode,
    defaultMarkup: 500
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('jazgot_user_first_name', firstName);
    localStorage.setItem('jazgot_user_email', email);
    localStorage.setItem(STORAGE_KEY_ACTIVE_AGENT, JSON.stringify(profile));
  }

  // Persist the referral code back to Supabase so client-side lookup finds this agent
  // (non-blocking — runs in background)
  supabase
    .from('user')
    .update({ referral_code: generatedCode })
    .eq('email', email)
    .then(({ error }) => {
      if (error) console.warn('Could not sync referral code to DB:', error.message);
    });

  return profile;
}

export function getActiveRole(): 'admin' | 'staff' | 'agent' {
  if (typeof window === 'undefined') return 'admin';
  const role = localStorage.getItem(STORAGE_KEY_USER_ROLE) as any;
  return role || 'admin';
}

export function setActiveRole(role: 'admin' | 'staff' | 'agent') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USER_ROLE, role);
}

export function getActiveAgent(): AgentProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'ag-agent',
      name: 'Agent',
      email: 'agent@jazgottours.com',
      code: 'JAZ-AGT',
      defaultMarkup: 500
    };
  }

  const storedFirstName = localStorage.getItem('jazgot_user_first_name');
  const storedEmail = localStorage.getItem('jazgot_user_email');
  const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_AGENT);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        // If Carlos Mendoza is found but user logged in as someone else or default needs refreshing:
        if (storedFirstName && (parsed.name === 'Carlos Mendoza' || parsed.name !== storedFirstName)) {
          parsed.name = storedFirstName;
          parsed.code = `JAZ-AGT-${storedFirstName.slice(0, 3).toUpperCase()}`;
          if (storedEmail) parsed.email = storedEmail;
        } else if (parsed.name === 'Carlos Mendoza' && !storedFirstName) {
          // Replace hardcoded default name if not deliberately set
          parsed.name = 'Agent';
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  if (storedFirstName || storedEmail) {
    const name = storedFirstName || formatFirstName(storedEmail);
    return {
      id: `ag-${name.toLowerCase()}`,
      name: name,
      email: storedEmail || `${name.toLowerCase()}@jazgottours.com`,
      code: `JAZ-AGT-${name.slice(0, 3).toUpperCase()}`,
      defaultMarkup: 500
    };
  }

  return {
    id: 'ag-agent',
    name: 'Agent',
    email: 'agent@jazgottours.com',
    code: 'JAZ-AGT',
    defaultMarkup: 500
  };
}

export function setActiveAgent(agent: AgentProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_AGENT, JSON.stringify(agent));
}

export function getStoredAgentBookings(): AgentBooking[] {
  if (typeof window === 'undefined') return INITIAL_AGENT_BOOKINGS;
  const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(INITIAL_AGENT_BOOKINGS));
    return INITIAL_AGENT_BOOKINGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_AGENT_BOOKINGS;
  }
}

export function saveStoredAgentBookings(bookings: AgentBooking[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
}

export function getAgentMarkups(agentEmail?: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const email = agentEmail || getActiveAgent().email;
  const raw = localStorage.getItem(`${STORAGE_KEY_MARKUPS}_${email}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAgentMarkup(packageKey: string | number, markup: number, agentEmail?: string) {
  if (typeof window === 'undefined') return;
  const email = agentEmail || getActiveAgent().email;
  const current = getAgentMarkups(email);
  current[String(packageKey)] = markup;
  localStorage.setItem(`${STORAGE_KEY_MARKUPS}_${email}`, JSON.stringify(current));
}

export async function createAgentBooking(params: {
  client_name: string;
  client_email: string;
  client_phone: string;
  tour_package: string;
  package_id?: number | string;
  pax: number;
  tour_date: string;
  base_price_per_pax: number;
  markup_per_pax: number;
  agent?: AgentProfile;
}): Promise<AgentBooking> {
  const agent = params.agent || getActiveAgent();
  const totalPricePerPax = params.base_price_per_pax + params.markup_per_pax;
  const totalAmount = totalPricePerPax * params.pax;
  const agentEarnings = params.markup_per_pax * params.pax;
  const adminCommission = Math.round(totalAmount * 0.05); // 5% Admin cut from agent's booking

  const id = `AB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const newBooking: AgentBooking = {
    id,
    client_name: params.client_name,
    client_email: params.client_email,
    client_phone: params.client_phone,
    tour_package: params.tour_package,
    package_id: params.package_id,
    pax: params.pax,
    tour_date: params.tour_date,
    is_agent_booking: true,
    agent_id: agent.id,
    agent_name: agent.name,
    agent_email: agent.email,
    base_price_per_pax: params.base_price_per_pax,
    markup_per_pax: params.markup_per_pax,
    total_price_per_pax: totalPricePerPax,
    total_amount: totalAmount,
    agent_earnings: agentEarnings,
    admin_commission: adminCommission,
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  // 1. Save to local storage
  const current = getStoredAgentBookings();
  const updated = [newBooking, ...current];
  saveStoredAgentBookings(updated);

  // 2. Sync to Supabase bookings table so it reflects everywhere
  try {
    await supabase.from('bookings').insert([
      {
        lead_guest_name: `${params.client_name} (via Agent: ${agent.name})`,
        email: params.client_email,
        contact_number: params.client_phone,
        tour_package: params.tour_package,
        pax: params.pax,
        tour_date: params.tour_date,
        total_amount: totalAmount,
        status: 'Pending',
        payment_status: 'pending'
      }
    ]);
  } catch (err) {
    console.warn('Supabase booking sync warning:', err);
  }

  return newBooking;
}

export function updateAgentBookingStatus(bookingId: string, newStatus: 'Pending' | 'Confirmed' | 'Cancelled') {
  const list = getStoredAgentBookings();
  const updated = list.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
  saveStoredAgentBookings(updated);
}

/**
 * Fetch agent bookings from Supabase `agent_bookings` table.
 * This picks up bookings where a client used this agent's referral code.
 * Returns an empty array if the table doesn't exist yet (graceful degradation).
 */
export async function fetchAgentBookingsFromSupabase(agent: AgentProfile): Promise<AgentBooking[]> {
  try {
    const { data, error } = await supabase
      .from('agent_bookings')
      .select('*')
      .or(
        `agent_id.eq.${agent.id},agent_email.eq.${agent.email},agent_referral_code.eq.${agent.code}`
      )
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet — silently return empty
      console.warn('agent_bookings fetch warning:', error.message);
      return [];
    }

    // Map Supabase rows → AgentBooking shape
    return (data || []).map((row: any): AgentBooking => ({
      id: row.id,
      client_name: row.client_name || '',
      client_email: row.client_email || '',
      client_phone: row.client_phone || '',
      tour_package: row.tour_package || '',
      package_id: row.package_id,
      pax: Number(row.pax) || 1,
      tour_date: row.tour_date || '',
      is_agent_booking: true,
      agent_id: row.agent_id || '',
      agent_name: row.agent_name || '',
      agent_email: row.agent_email || '',
      base_price_per_pax: 0, // hidden from agent
      markup_per_pax: Number(row.markup_per_pax) || 0,
      total_price_per_pax: 0,
      total_amount: Number(row.total_amount) || 0,
      agent_earnings: Number(row.agent_earnings) || 0,
      admin_commission: Number(row.admin_commission) || 0,
      status: (row.status as AgentBooking['status']) || 'Pending',
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
