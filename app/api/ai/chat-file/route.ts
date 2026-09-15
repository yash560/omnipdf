import { NextRequest, NextResponse } from 'next/server';
import { streamFileChat } from '@/lib/ai/chat-file-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const reply = await streamFileChat(messages, context || '');
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
