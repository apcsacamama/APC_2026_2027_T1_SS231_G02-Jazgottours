import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ahvfnuwdglbohtxwmrfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodmZudXdkZ2xib2h0eHdtcmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzY4ODEsImV4cCI6MjEwMzE1Mjg4MX0.F6vljBSLGHoNFL1D5gRjkj--0s3EF2epzjb6YOa7G7s'
);

// Tour inclusions & destinations mapping based on official references
const TOUR_DETAILS: Record<string, { description: string; destinations: { name: string; detail: string }[] }> = {
  'Tour A': {
    description: 'Experience the Island Hopping in El Nido with the most Famous Islands and Adventure. (08:30 AM to 04:30 PM), you can do Island Tours, Snorkeling, Swimming, Sightseeing in the Beaches, and kayaking.',
    destinations: [
      { name: 'Big Lagoon', detail: 'kayaking activity that you can go around 800meters to 1 kilometer inside to see the clear water of the Lagoon' },
      { name: 'Secret Lagoon', detail: "there's a small entrance to go inside and you can see the beautiful rock formations that looks like crocodile head, eagle head and more.." },
      { name: 'Snorkeling spot', detail: 'where you will see the crystal view of the corals and a lot of fishes' },
      { name: 'Shimizu Island', detail: 'a clear water beach that you will eat your lunch and do for snorkeling along the shores' },
      { name: 'Seven Commandos Beach', detail: 'a clean white sand beach that you relax, play volleyball, sunbathing, snorkeling, swimming, buy beers to drink and eat some snacks.' },
    ],
  },
  'Tour B': {
    description: 'Experience the Island Hopping in El Nido with the most Famous Islands and Adventure. (08:30 AM to 04:30 PM), you can do Island Tours, Snorkeling, Swimming, Sightseeing in the Beaches, and kayaking.',
    destinations: [
      { name: 'Big Lagoon', detail: 'kayaking activity that you can go around 800meters to 1 kilometer inside to see the clear water of the Lagoon' },
      { name: 'Secret Lagoon', detail: "there's a small entrance to go inside and you can see the beautiful rock formations that looks like crocodile head, eagle head and more.." },
      { name: 'Snorkeling spot', detail: 'where you will see the crystal view of the corals and a lot of fishes' },
      { name: 'Shimizu Island', detail: 'a clear water beach that you will eat your lunch and do for snorkeling along the shores' },
      { name: 'Seven Commandos Beach', detail: 'a clean white sand beach that you relax, play volleyball, sunbathing, snorkeling, swimming, buy beers to drink and eat some snacks.' },
    ],
  },
  'Tour C': {
    description: 'Experience the Island Hopping in El Nido with the most Famous Islands and Adventure. (08:30 AM to 04:30 PM), you can do Island Tours, Snorkeling, Swimming, Sightseeing in the Beaches, and kayaking.',
    destinations: [
      { name: 'Big Lagoon', detail: 'kayaking activity that you can go around 800meters to 1 kilometer inside to see the clear water of the Lagoon' },
      { name: 'Secret Lagoon', detail: "there's a small entrance to go inside and you can see the beautiful rock formations that looks like crocodile head, eagle head and more.." },
      { name: 'Snorkeling spot', detail: 'where you will see the crystal view of the corals and a lot of fishes' },
      { name: 'Shimizu Island', detail: 'a clear water beach that you will eat your lunch and do for snorkeling along the shores' },
      { name: 'Seven Commandos Beach', detail: 'a clean white sand beach that you relax, play volleyball, sunbathing, snorkeling, swimming, buy beers to drink and eat some snacks.' },
    ],
  },
};

export default async function QuotationViewPage({ params }: { params: Promise<{ reference: string }> | { reference: string } }) {
  const resolvedParams = await params;
  const reference = resolvedParams.reference;

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('reference_no', reference)
    .single();

  if (error || !quotation) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center font-sans">
        <h1 className="text-xl font-bold text-gray-800">Quotation Not Found</h1>
        <p className="text-xs text-gray-500 mt-2">The quotation reference <span className="font-mono font-semibold">{reference}</span> does not exist or has been removed.</p>
      </div>
    );
  }

  // Format date nicely (e.g. November 14, 2026)
  const formattedTourDate = quotation.tour_date 
    ? new Date(quotation.tour_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Not Specified';

  // Determine package type key for inclusions lookup
  const packageName = quotation.package_name || 'El Nido Island Hopping Tour A with Lunch';
  let tourKey = 'Tour A';
  if (packageName.includes('Tour B')) tourKey = 'Tour B';
  else if (packageName.includes('Tour C')) tourKey = 'Tour C';

  const currentTourDetails = TOUR_DETAILS[tourKey];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 font-sans text-gray-900 bg-white space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-start pb-6 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">Jazgot Tours Official Quotation</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Ref: {quotation.reference_no}</h1>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
            {quotation.status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Booking Package & Tour Date Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-3">Booking Package & Tour Date</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Selected Tour Package</span>
            <span className="font-bold text-gray-900 text-sm leading-snug">{packageName}</span>
          </div>

          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Tour Date</span>
            <span className="font-semibold text-blue-600 text-sm">{formattedTourDate}</span>
          </div>

          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Add-ons Selected</span>
            <span className="font-semibold text-gray-900">{quotation.add_ons || 'None'}</span>
          </div>

          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Headcount</span>
            <span className="font-semibold text-gray-900 text-sm">{quotation.pax} Pax</span>
          </div>
        </div>
      </div>

      {/* Tour Inclusions & Destinations Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-3">Tour Inclusions & Destinations ({tourKey})</h2>
        <p className="text-xs text-gray-600 leading-relaxed">{currentTourDetails.description}</p>
        
        <div className="pt-2 space-y-3">
          <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Destinations:</span>
          <ul className="space-y-2 text-xs text-gray-700">
            {currentTourDetails.destinations.map((dest, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong className="text-gray-900">{dest.name}</strong> — {dest.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-3">Client Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Client Name</span>
            <span className="font-semibold text-gray-900">{quotation.client_name}</span>
          </div>
          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Email Address</span>
            <span className="font-semibold text-gray-900">{quotation.client_email}</span>
          </div>
          <div>
            <span className="block text-gray-400 uppercase font-semibold tracking-wider mb-1">Contact Number</span>
            <span className="font-semibold text-gray-900">{quotation.client_contact || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Amount Payable</span>
          <p className="text-[10px] text-gray-400 mt-0.5">Inclusive of government environmental and port fees.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600">₱{Number(quotation.total_amount).toLocaleString()}</span>
        </div>
      </div>

    </div>
  );
}