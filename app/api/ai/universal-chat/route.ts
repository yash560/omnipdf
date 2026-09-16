import { NextRequest, NextResponse } from 'next/server';
import { processUniversalChat, UniversalChatRequest } from '@/lib/ai/universal-chat-engine';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const customApiKey = req.headers.get('x-custom-api-key') || rawBody.customApiKey;

    // Normalize messages array
    let messages = rawBody.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const singleText = rawBody.message || rawBody.query || rawBody.prompt;
      if (typeof singleText === 'string' && singleText.trim().length > 0) {
        messages = [{ role: 'user', content: singleText.trim() }];
      } else {
        return NextResponse.json(
          { error: 'Messages array or valid message string is required.' },
          { status: 400 }
        );
      }
    }

    const payload: UniversalChatRequest = {
      messages,
      fileContext: rawBody.fileContext || rawBody.context || rawBody.documentContext,
      imageBase64: rawBody.imageBase64,
      mimeType: rawBody.mimeType,
      toolSlug: rawBody.toolSlug,
      suite: rawBody.suite,
      personaId: rawBody.personaId,
      customApiKey,
    };

    const responseText = await processUniversalChat(payload);

    return NextResponse.json({
      success: true,
      text: responseText,
      response: responseText,
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

