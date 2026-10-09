import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Safe initialization that prevents build errors if env vars aren't injected at compile time
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

function getMinimumBookingDate() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const minimumDate = new Date(`${today}T00:00:00Z`);
  minimumDate.setUTCDate(minimumDate.getUTCDate() + 2);
  return minimumDate.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const packageId = new URL(request.url).searchParams.get('packageId');
  if (!packageId) {
    return NextResponse.json({ error: 'Package id is required' }, { status: 400 });
  }

  const { data: tourPackage, error: packageError } = await supabaseAdmin
    .from('packages')
    .select('title')
    .eq('id', packageId)
    .single();

  if (packageError || !tourPackage) {
    return NextResponse.json({ error: 'Tour package was not found' }, { status: 404 });
  }

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('tour_date')
    .eq('tour_package', tourPackage.title)
    .in('payment_status', ['pending', 'paid']);

  if (error) {
    console.error('Availability lookup error:', error);
    return NextResponse.json({ error: 'Could not load tour availability' }, { status: 500 });
  }

  return NextResponse.json({ bookedDates: bookings.map((booking) => booking.tour_date) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedTourDate = typeof body.tourDate === 'string'
      ? new Date(`${body.tourDate}T00:00:00Z`)
      : null;
    const validTourDate = parsedTourDate &&
      Number.isFinite(parsedTourDate.getTime()) &&
      parsedTourDate.toISOString().slice(0, 10) === body.tourDate;

    if (
      !body.packageId ||
      typeof body.leadGuestName !== 'string' ||
      !body.leadGuestName.trim() ||
      !Number.isSafeInteger(body.pax) ||
      body.pax < 1 ||
      typeof body.tourDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.tourDate) ||
      !validTourDate ||
      body.tourDate < getMinimumBookingDate() ||
      typeof body.contactNumber !== 'string' ||
      !/^(?:\+639|09)\d{9}$/.test(body.contactNumber)
    ) {
      return NextResponse.json({ error: 'Booking details are invalid or the tour date is too soon' }, { status: 400 });
    }

    const { data: tourPackage, error: packageError } = await supabaseAdmin
      .from('packages')
      .select('title, price')
      .eq('id', body.packageId)
      .single();

    if (packageError || !tourPackage) {
      return NextResponse.json({ error: 'Tour package was not found' }, { status: 404 });
    }

    const unitPrice = Number(tourPackage.price);
    const totalAmount = unitPrice * body.pax;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || Number(body.totalAmount) !== totalAmount) {
      return NextResponse.json({ error: 'Booking amount does not match the selected package' }, { status: 400 });
    }

    const { data: existingBookings, error: availabilityError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('tour_package', tourPackage.title)
      .eq('tour_date', body.tourDate)
      .in('payment_status', ['pending', 'paid'])
      .limit(1);

    if (availabilityError) {
      console.error('Availability validation error:', availabilityError);
      return NextResponse.json({ error: 'Could not confirm tour availability' }, { status: 500 });
    }
    if (existingBookings.length) {
      return NextResponse.json({ error: 'This tour date is already booked' }, { status: 409 });
    }

    let origin: string;
    try {
      origin = new URL(body.origin).origin;
    } catch {
      return NextResponse.json({ error: 'Invalid checkout origin' }, { status: 400 });
    }
    
    // 1. Authenticate with Paymongo using your Secret Key
    const paymongoSecret = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecret) {
      return NextResponse.json({ error: 'Paymongo secret key is missing' }, { status: 500 });
    }
    const encodedKey = Buffer.from(`${paymongoSecret}:`).toString('base64');
    
    // 2. Create the Paymongo Checkout Session
    const paymongoPayload = {
      data: {
        attributes: {
          billing: {
            name: body.leadGuestName,
            phone: body.contactNumber
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          
          cancel_url: `${origin}/checkout`,
          success_url: `${origin}/api/verify-payment`,
          
          description: 'Jazgot Tour Services Booking',
          line_items: [
            {
              currency: 'PHP',
              amount: unitPrice * 100,
              name: tourPackage.title,
              quantity: body.pax
            }
          ],
          payment_method_types: ['card', 'gcash', 'paymaya']
        }
      }
    };

    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${encodedKey}`
      },
      body: JSON.stringify(paymongoPayload)
    });

    const paymongoData = await paymongoRes.json();
    
    if (!paymongoRes.ok) {
      console.error("Paymongo Error:", paymongoData);
      return NextResponse.json({ error: 'Failed to create payment gateway session' }, { status: 500 });
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const checkoutId = paymongoData.data.id;

    // 3. Save the pending booking using supabaseAdmin to securely bypass RLS restrictions
    const { error: dbError } = await supabaseAdmin
      .from('bookings')
      .insert([
        {
          user_id: null, // <--- Change this to null to let the customer checkout go through immediately
          tour_package: tourPackage.title,
          lead_guest_name: body.leadGuestName,
          pax: body.pax,
          tour_date: body.tourDate,
          contact_number: body.contactNumber,
          total_amount: totalAmount,
          paymongo_checkout_id: checkoutId,
          payment_status: 'pending',
          status: 'Pending'
        }
      ]);

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ error: 'Failed to save booking to database' }, { status: 500 });
    }

    // 4. Send the Paymongo URL back to the frontend
    return NextResponse.json({ url: checkoutUrl });
    
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}