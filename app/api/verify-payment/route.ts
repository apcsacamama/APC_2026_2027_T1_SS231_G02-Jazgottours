import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Instantiate inside the handler so it only runs at runtime with active env vars
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    const invoiceNumber = `JGTINV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const today = new Date().toISOString().split('T')[0];

    // 1. Update booking status using admin client
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', booking.id);

    // 2. Insert into invoices table
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

    // 3. If booking was made with an agent referral code, create an agent booking record
    if (booking.agent_referral_code && booking.agent_id) {
      const markupPerPax = Number(booking.agent_markup_per_pax) || 0;
      const agentEarnings = markupPerPax * booking.pax;
      const adminCommission = Math.round(booking.total_amount * 0.05);
      const agentBookingId = `AB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const { error: agentBookingError } = await supabaseAdmin
        .from('agent_bookings')
        .insert([
          {
            id: agentBookingId,
            client_name: booking.lead_guest_name,
            client_email: booking.email || '',
            client_phone: booking.contact_number || '',
            tour_package: booking.tour_package,
            pax: booking.pax,
            tour_date: booking.tour_date,
            is_agent_booking: true,
            agent_id: booking.agent_id,
            agent_name: booking.agent_name,
            agent_email: booking.agent_email,
            agent_referral_code: booking.agent_referral_code,
            markup_per_pax: markupPerPax,
            total_amount: booking.total_amount,
            agent_earnings: agentEarnings,
            admin_commission: adminCommission,
            status: 'Confirmed',
            created_at: new Date().toISOString()
          }
        ]);

      if (agentBookingError) {
        // agent_bookings table may not exist yet — log but don't block the redirect
        console.warn("Agent booking insert warning (table may not exist):", agentBookingError.message);
      } else {
        console.log("Agent booking record created:", agentBookingId);
      }
    }

  } catch (err) {
    console.error("Verify Payment Exception:", err);
  }

  return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
}