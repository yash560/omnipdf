import { NextRequest, NextResponse } from 'next/server';
import { summarizeAudioMeeting } from '@/lib/ai/audio-summarizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio, mimeType } = body;

    if (!audio) {
      return NextResponse.json({ error: 'Audio base64 required' }, { status: 400 });
    }

    const summary = await summarizeAudioMeeting(audio, mimeType);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
