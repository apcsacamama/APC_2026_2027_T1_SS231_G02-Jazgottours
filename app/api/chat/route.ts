import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const { prompt } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'A prompt is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // System context tailored for JazGot Tours
    const systemInstruction = `You are a helpful customer support agent for JazGot Tours in El Nido, Palawan. 
    You help customers book Tour A (₱1350), Tour B (₱1500), Tour C (₱1600), and Tour D (₱1400). 
    Remind them that the ETDF fee is ₱400 (valid for 10 days) and the Lagoon Entrance for Tour A is ₱200.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemInstruction}\n\nUser: ${prompt}`
    });

    return NextResponse.json({ reply: response.text });
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