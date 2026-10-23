'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahvfnuwdglbohtxwmrfc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodmZudXdkZ2xib2h0eHdtcmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzY4ODEsImV4cCI6MjEwMzE1Mjg4MX0.F6vljBSLGHoNFL1D5gRjkj--0s3EF2epzjb6YOa7G7s';

// Initialize Supabase with the service role key if available, else anon key
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || anonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function createUserAccount(prevState: any, formData: FormData) {
  const username = (formData.get('username') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const role = (formData.get('role') as string || 'staff').trim();

  if (!email || !password || !username) {
    return { success: false, error: 'All fields (Username, Email, and Password) are required.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Temporary password must be at least 6 characters long.' };
  }

  try {
    let authUserId: string | null = null;

    // 1. Attempt Supabase Auth creation if service role key is available
    if (serviceRoleKey) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username,
            full_name: username,
            role,
          },
        });

        if (authUser?.user) {
          authUserId = authUser.user.id;
        } else if (authError?.message?.toLowerCase().includes('already registered')) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email?.toLowerCase() === email);
          if (existing) {
            authUserId = existing.id;
            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              password,
              email_confirm: true,
              user_metadata: { username, full_name: username, role },
            });
          }
        }
      } catch (authErr) {
        console.warn('Supabase Auth provisioning note:', authErr);
      }
    }

    // 2. Persist to public.user table with credentials for reliable sign-in
    const userPayload: any = {
      email,
      full_name: username,
      role,
      password,
      updated_at: new Date().toISOString(),
    };
    if (authUserId) {
      userPayload.id = authUserId;
    }

    const { error: userTableError } = await supabaseAdmin
      .from('user')
      .upsert(userPayload, { onConflict: 'email' });

    if (userTableError) {
      // If password column hasn't been added yet, retry without password column
      if (userTableError.message?.includes('password')) {
        delete userPayload.password;
        const { error: retryError } = await supabaseAdmin
          .from('user')
          .upsert(userPayload, { onConflict: 'email' });
        if (retryError) throw retryError;
      } else {
        throw userTableError;
      }
    }

    // 3. Keep profiles table updated as well for backward compatibility
    try {
      await supabaseAdmin.from('profiles').upsert({
        username,
        email,
        role,
      }, { onConflict: 'email' });
    } catch {
      // Non-blocking
    }

    // 4. If the account is an agent, generate and persist their referral code
    if (role === 'agent') {
      try {
        // Derive referral code from the first 3 letters of the username
        const firstPart = username.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'AGT';
        const referralCode = `JAZ-AGT-${firstPart}`;

        await supabaseAdmin
          .from('user')
          .update({ referral_code: referralCode })
          .eq('email', email);
      } catch (refErr) {
        console.warn('Could not save referral code (column may not exist yet):', refErr);
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create user account.' };
  }
}

// Backward compatible export for existing callers
export const createStaffAccount = createUserAccount;

export async function deleteUserAccount(id: string, email?: string) {
  try {
    // 1. Delete from public.user table
    if (id) {
      await supabaseAdmin.from('user').delete().eq('id', id);
    }
    if (email) {
      await supabaseAdmin.from('user').delete().eq('email', email);
    }

    // 2. Delete from profiles table
    if (id) {
      await supabaseAdmin.from('profiles').delete().eq('id', id);
    }
    if (email) {
      await supabaseAdmin.from('profiles').delete().eq('email', email);
    }

    // 3. If service role key is available, delete from auth.users
    if (serviceRoleKey && id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch (authErr) {
        console.warn('Could not remove from auth.users:', authErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete account.' };
  }
}