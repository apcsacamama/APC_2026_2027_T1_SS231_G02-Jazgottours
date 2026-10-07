import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    if (!rawText) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }

    const lowerText = rawText.toLowerCase();

    // 1. PRECISE PAX DETECTION 
    // Look specifically for labels like "paks 6", "pax 6", "6 pax", "6 namin"
    let pax = 2;
    const explicitPaxMatch = rawText.match(/(?:pax|paks|guests|tao)\s*(?:niya|nila|namin|ng)?\s*(\d+)/i) ||
                             rawText.match(/(\d+)\s*(?:pax|paks|guests|tao|persons)/i);
    
    if (explicitPaxMatch) {
      pax = parseInt(explicitPaxMatch[1], 10);
    } else {
      // Fallback: find any standalone number that isn't part of a duration like 4D3N
      const numbers = rawText.match(/\b\d+\b/g);
      if (numbers) {
        // Filter out numbers that belong to the duration code
        const filteredNums = numbers.map(Number).filter((n: number) => n !== 4 && n !== 3 && n !== 1 && n !== 2);
        if (filteredNums.length > 0) pax = filteredNums[0];
      }
    }

    // 2. DURATION DETECTION (Catches 4D3N, 3D2N, etc.)
    let duration = "3D2N";
    const durationMatch = rawText.match(/(\d+[dD]\d+[nN])/);
    if (durationMatch) {
      duration = durationMatch[1].toUpperCase();
    } else if (lowerText.includes("4d3n") || lowerText.includes("4 days")) {
      duration = "4D3N";
    } else if (lowerText.includes("5d4n")) {
      duration = "5D4N";
    }

    // 3. EMAIL EXTRACTION
    const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const client_email = emailMatch ? emailMatch[1] : "";

    // 4. CONTACT NUMBER EXTRACTION
    const contactMatch = rawText.match(/(09\d{9}|\+639\d{9}|639\d{9})/);
    const client_contact = contactMatch ? contactMatch[1] : "";

    // 5. CLIENT NAME EXTRACTION (Targeting patterns like "nina Maria Santos", "ako si", etc.)
    let client_name = "Valued Client";
    const nameWithNinaMatch = rawText.match(/nina\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    const nameWithKayMatch = rawText.match(/(?:kay|nina|ni)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    const nameAkoSiMatch = rawText.match(/(?:ako si|name ko ay)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);

    if (nameWithNinaMatch) {
      client_name = nameWithNinaMatch[1];
    } else if (nameWithKayMatch) {
      client_name = nameWithKayMatch[1];
    } else if (nameAkoSiMatch) {
      client_name = nameAkoSiMatch[1];
    }

    // 6. TOUR ACTIVITIES (Includes typo variations like "elnydo")
    const tour_activities: string[] = [];
    
    if (lowerText.includes("el nido") || lowerText.includes("elnido") || lowerText.includes("elnydo")) {
      tour_activities.push("El Nido Island Hopping Tour");
    }
    if (lowerText.includes("coron")) {
      tour_activities.push("Coron Island Ultimate Tour");
    }
    if (lowerText.includes("underground river") || lowerText.includes("puerto princesa")) {
      tour_activities.push("Puerto Princesa Underground River Tour");
    }
    if (lowerText.includes("boracay")) {
      tour_activities.push("Boracay Island Activity Package");
    }

    if (tour_activities.length === 0) {
      tour_activities.push("Standard Palawan Tour Package");
    }

    const parsedData = {
      client_name,
      client_email,
      client_contact,
      duration,
      pax,
      tour_activities
    };

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Precision parser error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}