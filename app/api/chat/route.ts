import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // System context tailored for JazGot Tours
    const systemInstruction = `You are a helpful customer support agent for JazGot Tours in El Nido, Palawan. 
    You help customers book Tour A (₱1350), Tour B (₱1500), Tour C (₱1600), and Tour D (₱1400). 
    Remind them that the ETDF fee is ₱400 (valid for 10 days) and the Lagoon Entrance for Tour A is ₱200.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstruction}\n\nUser: ${prompt}`
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  }
}