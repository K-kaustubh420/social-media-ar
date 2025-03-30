// app/api/mistral/route.ts
import { Mistral } from '@mistralai/mistralai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // or 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error('Mistral API key not found in environment variables.');
      return NextResponse.json({ error: 'Mistral API key missing' }, { status: 500 });
    }

    const { startLat, startLon, endLat, endLon } = await req.json();

    if (!startLat || !startLon || !endLat || !endLon) {
      return NextResponse.json({ error: 'Missing start or end coordinates' }, { status: 400 });
    }

    const prompt = `Provide a step-by-step travel plan from latitude ${startLat}, longitude ${startLon} to latitude ${endLat}, longitude ${endLon}, similar to what a navigation app would show.

      *   **Public Transport:**  Provide a clear, numbered list of steps, including specific modes of transport (e.g., bus number, train line), transfer locations, and estimated travel times.
      *   **Driving (Own Vehicle):** Provide a separate, clear, numbered list of driving directions, including highway names/numbers, major landmarks, and information about tolls, potential traffic delays, and parking options at the destination.  Highlight any important border crossing procedures if applicable.

      Format the output clearly for easy parsing by a computer program. Avoid verbose descriptions. Focus on actionable steps.`;

    const client = new Mistral({ apiKey: apiKey });

    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest', // Adjust
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // Adjusted for more predictability
      max_tokens: 500,    // Increased to handle more detailed steps
    });

    const suggestion = chatResponse.choices[0].message.content.trim();

    return NextResponse.json({ suggestion });

  } catch (error: any) {
    console.error('Error calling Mistral API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}