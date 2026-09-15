import { keyRotator } from './gemini-key-rotator';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export async function streamFileChat(
  messages: ChatMessage[],
  fileContext: string
): Promise<string> {
  const apiKey = keyRotator.getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = [
    `You are an expert AI file assistant. Answer questions based on the following document context accurately, citing specific sections if appropriate:\n\n=== DOCUMENT CONTEXT ===\n${fileContext.substring(0, 50000)}\n=== END CONTEXT ===\n\n`,
    ...messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
  ].join('\n');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) keyRotator.markRateLimited(apiKey);
      if (res.status === 400 || res.status === 403) keyRotator.markPermanentFailure(apiKey);
      throw new Error(`Gemini API responded with ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (err: any) {
    throw err;
  }
}
