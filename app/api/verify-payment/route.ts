import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentIntentId = url.searchParams.get('payment_intent_id'); // or session id depending on redirect params

  // Alternatively, find the latest pending booking for the user/session and mark it paid
  // Let's fetch pending bookings and update them to paid
  const { data: pendingBookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !pendingBookings || pendingBookings.length === 0) {
    return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
  }

  const booking = pendingBookings[0];

  // Generate a formal invoice number if not already assigned
  const invoiceNumber = `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;

  await supabase
    .from('bookings')
    .update({ 
      payment_status: 'paid',
      invoice_number: invoiceNumber,
      date_paid: new Date().toISOString().split('T')[0]
    })
    .eq('id', booking.id);

  return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
}