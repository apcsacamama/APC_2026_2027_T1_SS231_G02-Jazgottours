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
  if (typeof window === 'undefined') return REGISTERED_AGENTS[0];
  const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_AGENT);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return REGISTERED_AGENTS[0];
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

  // 2. Add notification for the admin
  addAdminCommissionNotification({
    type: 'booking_created',
    title: 'New Agent Booking Received',
    message: `Agent ${agent.name} submitted booking ${id} for client ${params.client_name} (₱${totalAmount.toLocaleString()} total). Awaiting payment confirmation.`,
    booking_id: id,
    client_name: params.client_name,
    agent_name: agent.name,
    tour_package: params.tour_package,
    commission_earned: adminCommission,
  });

  // 3. Sync to Supabase bookings table so it reflects everywhere
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

export interface AdminCommissionNotification {
  id: string;
  type: 'booking_created' | 'booking_confirmed';
  title: string;
  message: string;
  booking_id: string;
  client_name: string;
  agent_name?: string;
  tour_package: string;
  commission_earned: number;
  created_at: string;
}

const STORAGE_KEY_NOTIFICATIONS = 'jazgot_admin_commission_notifications';

export function getAdminCommissionNotifications(): AdminCommissionNotification[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  if (!raw) {
    const initial: AdminCommissionNotification[] = [
      {
        id: 'notif-1',
        type: 'booking_confirmed',
        title: 'Commission Generated — ₱300',
        message: 'Booking AB-2026-002 paid & confirmed! You generated ₱300 in commission from Agent Maria Ramos (Client: Liam Johnson | Tour A with Lunch).',
        booking_id: 'AB-2026-002',
        client_name: 'Liam Johnson',
        agent_name: 'Maria Ramos',
        tour_package: 'Tour A with Lunch',
        commission_earned: 300,
        created_at: '2026-10-10T09:15:00Z'
      },
      {
        id: 'notif-2',
        type: 'booking_confirmed',
        title: 'Commission Generated — ₱675',
        message: 'Booking AB-2026-003 paid & confirmed! You generated ₱675 in commission from Agent Carlos Mendoza (Client: Chloe Zhang | Coron Island Escape).',
        booking_id: 'AB-2026-003',
        client_name: 'Chloe Zhang',
        agent_name: 'Carlos Mendoza',
        tour_package: 'Coron Island Escape',
        commission_earned: 675,
        created_at: '2026-10-09T16:45:00Z'
      },
      {
        id: 'notif-3',
        type: 'booking_created',
        title: 'New Agent Booking Received',
        message: 'Agent Carlos Mendoza submitted booking AB-2026-001 for client Sophia Taylor & Family (₱28,000 total). Awaiting confirmation.',
        booking_id: 'AB-2026-001',
        client_name: 'Sophia Taylor & Family',
        agent_name: 'Carlos Mendoza',
        tour_package: 'El Nido 4D3N Complete Island Adventure',
        commission_earned: 1400,
        created_at: '2026-10-11T14:30:00Z'
      }
    ];
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAdminCommissionNotification(notif: Omit<AdminCommissionNotification, 'id' | 'created_at'>) {
  if (typeof window === 'undefined') return;
  const current = getAdminCommissionNotifications();
  const newNotif: AdminCommissionNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([newNotif, ...current]));
}

export function dismissAdminCommissionNotification(id: string) {
  if (typeof window === 'undefined') return;
  const current = getAdminCommissionNotifications();
  const updated = current.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
}

export function updateAgentBookingStatus(bookingId: string, newStatus: 'Pending' | 'Confirmed' | 'Cancelled') {
  const list = getStoredAgentBookings();
  const booking = list.find((b) => b.id === bookingId);
  const updated = list.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
  saveStoredAgentBookings(updated);

  if (newStatus === 'Confirmed' && booking) {
    addAdminCommissionNotification({
      type: 'booking_confirmed',
      title: `Commission Generated — ₱${booking.admin_commission.toLocaleString()}`,
      message: `Booking ${booking.id} paid & confirmed! You generated ₱${booking.admin_commission.toLocaleString()} in commission from Agent ${booking.agent_name} (Client: ${booking.client_name} | Tour: ${booking.tour_package}).`,
      booking_id: booking.id,
      client_name: booking.client_name,
      agent_name: booking.agent_name,
      tour_package: booking.tour_package,
      commission_earned: booking.admin_commission,
    });
  }
}
