import { NextRequest, NextResponse } from 'next/server';
import { processUniversalChat, UniversalChatRequest } from '@/lib/ai/universal-chat-engine';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UniversalChatRequest;

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const responseText = await processUniversalChat(body);

    return NextResponse.json({
      success: true,
      text: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[UniversalChatAPI] Error processing request:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process AI chat request.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
