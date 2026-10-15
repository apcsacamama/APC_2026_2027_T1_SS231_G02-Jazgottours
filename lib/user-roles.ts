export type AppRole = 'admin' | 'staff' | 'agent';

export interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const ROLE_DOMAINS: Record<AppRole, string> = {
  staff: '@jazgottours.com',
  agent: '@jazgottours.com',
  admin: '@jazgottours.com',
};

export const ROLE_LABELS: Record<AppRole, { label: string; badge: string; description: string; dashboard: string }> = {
  admin: {
    label: 'Administrator',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full System Control (Invoices, Commissions, Users, Settings)',
    dashboard: '/admin',
  },
  staff: {
    label: 'Staff Member',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Operations Dashboard (Bookings & Quotations only)',
    dashboard: '/admin',
  },
  agent: {
    label: 'Tour Agent',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Tour Agent Portal (Agent Dashboard, Bookings, Packages)',
    dashboard: '/agent',
  },
};

/**
 * Automatically creates the recommended email according to the specified role.
 * e.g., username "rio" + role "staff" => "rio@jazgottours.com"
 * e.g., username "rio" + role "agent" => "rio@jazgottours.com"
 */
export function generateDefaultEmail(username: string, role: AppRole): string {
  const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const prefix = cleanName || 'username';
  const domain = ROLE_DOMAINS[role] || '@jazgottours.com';
  return `${prefix}${domain}`;
}

/**
 * Resolves the authoritative role of a user given their email, database role, and auth metadata.
 */
export function resolveUserRole(
  email?: string | null,
  metadataRole?: string | null,
  dbRole?: string | null
): AppRole {
  // 1. Direct database role
  if (dbRole === 'admin' || dbRole === 'staff' || dbRole === 'agent') {
    return dbRole;
  }

  // 2. Auth user metadata role
  if (metadataRole === 'admin' || metadataRole === 'staff' || metadataRole === 'agent') {
    return metadataRole;
  }

  if (!email) return 'staff';
  const cleanEmail = email.trim().toLowerCase();

  // 3. All portal accounts use @jazgottours.com
  //    Role is determined by stored DB/metadata role above.
  //    If only email is available and it ends with @jazgottours.com,
  //    default to 'staff' (safe fallback — layout will redirect agents).
  if (cleanEmail.endsWith('@jazgottours.com')) {
    return 'staff';
  }

  return 'staff';
}

/**
 * Returns the exact dashboard URL where this role is permitted to navigate.
 */
export function getAuthorizedDashboard(role: AppRole): string {
  if (role === 'agent') return '/agent';
  return '/admin';
}

/**
 * Strict role access check for any pathname in the app.
 */
export function isRouteAllowedForRole(pathname: string, role: AppRole): boolean {
  if (pathname === '/admin/login' || pathname === '/login' || pathname === '/signin') {
    return true;
  }

  // Agents can ONLY access /agent and subroutes
  if (role === 'agent') {
    return pathname === '/agent' || pathname.startsWith('/agent/');
  }

  // Staff can access /admin, but are strictly excluded from /agent and admin-only pages
  if (role === 'staff') {
    if (pathname.startsWith('/agent')) return false;

    // Admin exclusive sections
    const adminExclusive = ['/admin/clients', '/admin/invoices', '/admin/commisions'];
    if (adminExclusive.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return false;
    }

    return pathname.startsWith('/admin');
  }

  // Admin has access to everything in /admin, and can inspect /agent if desired
  if (role === 'admin') {
    return true;
  }

  return false;
}
