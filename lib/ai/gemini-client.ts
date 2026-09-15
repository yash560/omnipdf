import { keyRotator } from './gemini-key-rotator';

interface GeminiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string; // Optional Base64 JPEG/PNG image for vision analysis
  mimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGeminiWithRotation(options: GeminiRequestOptions): Promise<string> {
  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = keyRotator.getNextKey();
    if (!apiKey) {
      throw new Error('No available Gemini API keys in rotation pool.');
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const contents: any[] = [];
      const parts: any[] = [];

      // Add image if provided (for multimodal vision)
      if (options.imageBase64) {
        // Strip data:image/...;base64, prefix if present
        const cleanBase64 = options.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: options.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      // Add prompt
      parts.push({ text: options.prompt });
      contents.push({ role: 'user', parts });

      const body: any = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 4096,
        },
      };

      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        keyRotator.markRateLimited(apiKey);
        continue; // Retry with next rotated key
      }

      if (response.status === 400 || response.status === 403) {
        const errText = await response.text();
        if (errText.includes('API_KEY_INVALID') || errText.includes('PERMISSION_DENIED')) {
          keyRotator.markPermanentFailure(apiKey, `${response.status}`);
          continue; // Retry with next rotated key
        }
      }

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorDetails}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response received from Gemini.');
      }

      return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`[GeminiClient] Attempt ${attempt + 1} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('Failed to generate content after multiple Gemini key rotations.');
}

/**
 * Helper to call Gemini and strictly parse JSON result
 */
export async function callGeminiJson<T>(options: GeminiRequestOptions): Promise<T> {
  const rawText = await callGeminiWithRotation({
    ...options,
    prompt: `${options.prompt}\n\nIMPORTANT: Respond ONLY with a valid raw JSON object. Do not include markdown codeblocks or commentary.`,
  });

  // Strip ```json and ``` if returned
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', cleaned);
    throw new Error('Gemini response could not be parsed as valid JSON.');
  }
}
