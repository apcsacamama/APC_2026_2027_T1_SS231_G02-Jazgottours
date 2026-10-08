import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { data: pendingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !pendingBookings || pendingBookings.length === 0) {
      console.log("No pending bookings found to verify.");
      return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
    }

    const booking = pendingBookings[0];
    const invoiceNumber = `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const today = new Date().toISOString().split('T')[0];

    // 1. Update booking status using admin client
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', booking.id);

    // 2. Insert into invoices table (bypassing RLS safely with service role key)
    const { error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          invoice_no: invoiceNumber,
          client_name: booking.lead_guest_name,
          total_amount: booking.total_amount,
          date_paid: today,
          status: 'Confirmed Booking',
          tour_package: booking.tour_package,
          contact_number: booking.contact_number,
          pax: booking.pax,
          tour_date: booking.tour_date
        }
      ]);

    if (insertError) {
      console.error("Verify Payment Invoice Insert Error:", insertError);
    } else {
      console.log("Successfully inserted invoice into database:", invoiceNumber);
    }
  } catch (err) {
    console.error("Verify Payment Exception:", err);
  }

  return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
}