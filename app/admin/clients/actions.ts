'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the service role key for admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function createStaffAccount(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !username) {
    return { success: false, error: 'All fields are required.' };
  }

  try {
    // Use Supabase Admin API to create the user without switching sessions
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email if desired
      user_metadata: {
        username,
        role,
      },
    });

    if (error) throw error;

    // Optional: Manually insert or ensure the profile row is updated with role/username if your trigger doesn't handle it
    if (data?.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          username,
          email,
          role,
        });

      if (profileError) throw profileError;
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create account.' };
  }
}