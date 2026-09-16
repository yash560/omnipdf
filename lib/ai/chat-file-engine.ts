import { callGeminiWithRotation } from './gemini-client';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export async function streamFileChat(
  messages: ChatMessage[],
  fileContext: string
): Promise<string> {
  const systemInstruction = `You are an expert AI file assistant. Answer questions based on the provided document context accurately, citing specific sections if appropriate. Format with clean markdown, lists, and tables where applicable.`;

  const lastUserMessage = messages[messages.length - 1]?.content || 'Summarize this file.';
  const previousTurns = messages.slice(0, -1);

  let formattedPrompt = '';
  if (previousTurns.length > 0) {
    formattedPrompt += 'Conversation History:\n';
    for (const msg of previousTurns) {
      const roleName = msg.role === 'user' ? 'User' : 'Assistant';
      formattedPrompt += `${roleName}: ${msg.content}\n`;
    }
    formattedPrompt += '\nCurrent Request:\n' + lastUserMessage;
  } else {
    formattedPrompt = lastUserMessage;
  }

  return await callGeminiWithRotation({
    prompt: formattedPrompt,
    systemInstruction,
    fallbackContext: fileContext,
    temperature: 0.25,
    maxOutputTokens: 4096,
  });
}

