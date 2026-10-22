import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function formatReply(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|```/g, ''))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*{1,2}/g, '')
    .replace(/([A-Za-z])\/([A-Za-z])/g, '$1 or $2')
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'A prompt is required' }, { status: 400 });
    }

    const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    if (!accessToken || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Please sign in to use the chat assistant' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to use the chat assistant' }, { status: 401 });
    }

    const isQuotationRequest = /\b(?:quote|quotes|quotation|quotations|price estimate|estimate a price)\b/i.test(prompt);
    if (isQuotationRequest) {
      const { data: bookings, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (bookingError) {
        console.error('Failed to check customer bookings:', bookingError.message);
        return NextResponse.json({ error: 'Unable to verify your booking right now. Please try again shortly.' }, { status: 500 });
      }

      if (!bookings?.length) {
        return NextResponse.json({
          reply: 'Please complete a tour booking before requesting a quotation. Once you have a booking, I can help with your quotation questions.',
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a helpful customer support agent for JazGot Tours in El Nido, Palawan. Help customers with Tour A (₱1350), Tour B (₱1500), Tour C (₱1600), and Tour D (₱1400). The ETDF fee is ₱400 and is valid for 10 days. The Lagoon Entrance fee for Tour A is ₱200. Answer in clear, concise plain text with short paragraphs. Do not use Markdown, asterisks, slash characters, headings, or decorative separators. Use words such as "and" or "or" instead of slash punctuation. Do not invent prices or booking details.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemInstruction}\n\nUser: ${prompt}`
    });

    return NextResponse.json({ reply: formatReply(response.text || 'Sorry, I could not prepare a response. Please try again.') });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Gemini chat request failed:', errorMessage);
    if (errorMessage.includes('"code":503') || errorMessage.includes('"status":"UNAVAILABLE"')) {
      return NextResponse.json(
        { error: 'The AI service is temporarily busy. Please try again shortly.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  }
}