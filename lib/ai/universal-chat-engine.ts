import { callGeminiWithRotation } from './gemini-client';
import {
  AIPersonaId,
  AIPersona,
  AI_PERSONAS,
  ToolActionChip,
  TOOL_ACTION_CHIPS,
  UniversalChatRequest,
} from './ai-types';

export type { AIPersonaId, AIPersona, ToolActionChip, UniversalChatRequest };
export { AI_PERSONAS, TOOL_ACTION_CHIPS };

export async function processUniversalChat(request: UniversalChatRequest): Promise<string> {
  const persona = AI_PERSONAS[request.personaId || 'general'] || AI_PERSONAS.general;

  const contextSegments: string[] = [];
  if (request.toolSlug) {
    contextSegments.push(`[Active Tool]: ${request.toolSlug}`);
  }
  if (request.suite) {
    contextSegments.push(`[Active Suite]: ${request.suite}`);
  }
  if (request.fileContext && request.fileContext.trim().length > 0) {
    // Truncate text context safely to ~60k characters for speed and reliability
    contextSegments.push(`=== FILE CONTEXT / EXTRACTED DATA ===\n${request.fileContext.substring(0, 60000)}\n=== END FILE CONTEXT ===`);
  }

  const systemInstruction = `${persona.systemPrompt}
  
${contextSegments.length > 0 ? `CURRENT ACTIVE FILE CONTEXT:\n${contextSegments.join('\n\n')}` : ''}

Always format output with rich Markdown (tables, bold headers, bullet lists, code blocks with language identifiers where relevant). Be concise, helpful, and high-impact.`;

  // Build the conversation prompt
  const lastUserMessage = request.messages[request.messages.length - 1]?.content || 'Hello, please assist me with this file.';
  const previousTurns = request.messages.slice(0, -1);

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
    imageBase64: request.imageBase64,
    mimeType: request.mimeType || 'image/jpeg',
    temperature: 0.25,
    maxOutputTokens: 4096,
  });
}
