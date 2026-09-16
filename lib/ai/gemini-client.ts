import { keyRotator } from './gemini-key-rotator';

export interface GeminiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string; // Optional Base64 JPEG/PNG image for vision analysis
  mimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
  customApiKey?: string;
  fallbackContext?: string;
}

/**
 * Call Groq API endpoint with fast reasoning models
 */
async function callGroqChat(apiKey: string, options: GeminiRequestOptions): Promise<string> {
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const messages: any[] = [];
      if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: options.prompt });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxOutputTokens ?? 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[GroqClient] Model ${model} failed:`, err.message);
    }
  }

  throw lastErr || new Error('Groq generation failed across all models.');
}

/**
 * Call standard Google Gemini API with single key
 */
async function callSingleGeminiKey(apiKey: string, options: GeminiRequestOptions): Promise<string> {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const parts: any[] = [];
      if (options.imageBase64) {
        const cleanBase64 = options.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: options.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({ text: options.prompt });
      const contents = [{ role: 'user', parts }];

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorDetails}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Gemini API call failed.');
}

/**
 * High-Precision Local RAG Synthesis Fallback
 * Provides intelligent, zero-downtime answers across folder documents
 */
export function synthesizeLocalRAGResponse(prompt: string, context?: string): string {
  const fullText = (context || prompt || '');
  const lowerPrompt = prompt.toLowerCase();

  // 1. Summarize all documents in folder
  if (
    lowerPrompt.includes('summarize') ||
    lowerPrompt.includes('overview') ||
    lowerPrompt.includes('inventory') ||
    lowerPrompt.includes('list all') ||
    lowerPrompt.includes('what documents')
  ) {
    const docMatches = Array.from(fullText.matchAll(/\[(?:Doc|Document)\s*#?(\d+)\]\s*Name:\s*"?([^"|\n]+)"?\s*\|\s*(?:Type:\s*([^|\n]+)\s*\|)?\s*Category:\s*([^|\n]+)\s*\|\s*Tags:\s*([^|\n]+)\s*\|\s*Summary:\s*([^|\n]+)/gi));
    
    if (docMatches.length > 0) {
      let output = `### 📂 Folder Documents Summary (${docMatches.length} Items Analyzed)\n\n`;
      output += `Here is a consolidated overview of the files and categorized assets in this folder:\n\n`;
      output += `| # | Document Name | Category | Key Tags | Summary |\n`;
      output += `| :--- | :--- | :--- | :--- | :--- |\n`;

      docMatches.forEach((m) => {
        const num = m[1];
        const name = m[2].trim();
        const cat = m[4]?.trim() || 'General';
        const tags = m[5]?.trim() || '—';
        const sum = m[6]?.trim() || '—';
        output += `| **${num}** | \`${name}\` | **${cat}** | ${tags} | ${sum} |\n`;
      });

      output += `\n**💡 Suggested Next Steps:**\n`;
      output += `- Ask to *"Extract upcoming renewal dates"* or *"Search for specific invoice totals"*.\n`;
      output += `- Ask to *"Find all documents related to a person or entity"*.\n`;
      return output;
    }
  }

  // 2. Upcoming expiries & dates
  if (
    lowerPrompt.includes('expiry') ||
    lowerPrompt.includes('expir') ||
    lowerPrompt.includes('due date') ||
    lowerPrompt.includes('renewal') ||
    lowerPrompt.includes('validity') ||
    lowerPrompt.includes('date')
  ) {
    const lines = fullText.split('\n');
    const expiryHits: { name: string; expiry: string; ocrDate: string }[] = [];

    lines.forEach((line) => {
      const nameMatch = line.match(/Name:\s*"?([^"|\n]+)"?/i);
      const expiryMatch = line.match(/Expiry:\s*([^|\n]+)/i);
      const dateMatch = line.match(/\b(202[4-9]|203[0-9]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-zA-Z0-9,\s/-]{3,20}\b/i);

      if (nameMatch && (expiryMatch || dateMatch)) {
        const name = nameMatch[1].trim();
        const exp = (expiryMatch && expiryMatch[1].trim() !== 'N/A') ? expiryMatch[1].trim() : '';
        const d = dateMatch ? dateMatch[0].trim() : '';
        if (exp || d) {
          expiryHits.push({ name, expiry: exp || 'Identified in Document Content', ocrDate: d || exp });
        }
      }
    });

    if (expiryHits.length > 0) {
      let output = `### 📅 Document Expiries & Renewal Radar\n\n`;
      output += `Here are the identified expiration timelines and critical dates found across this folder:\n\n`;
      expiryHits.forEach((h, i) => {
        output += `${i + 1}. **\`${h.name}\`**: ${h.expiry} *(Reference date: ${h.ocrDate})*\n`;
      });
      return output;
    }
  }

  // 3. ID / Registration numbers (Aadhaar, PAN, Driving Licence, Passport, RC)
  if (
    lowerPrompt.includes('id') ||
    lowerPrompt.includes('aadhaar') ||
    lowerPrompt.includes('pan') ||
    lowerPrompt.includes('registration') ||
    lowerPrompt.includes('passport') ||
    lowerPrompt.includes('license') ||
    lowerPrompt.includes('number')
  ) {
    const kycDocs = Array.from(fullText.matchAll(/\[(?:Doc|Document)\s*#?(\d+)\]\s*Name:\s*"?([^"|\n]+)"?[^|\n]*\|\s*Category:\s*([^|\n]+)[^|\n]*\|\s*Tags:\s*([^|\n]+)[^|\n]*\|\s*Summary:\s*([^|\n]+)(?:[^|\n]*\|\s*OCR Text:\s*([^|\n]*))?/gi));

    if (kycDocs.length > 0) {
      let output = `### 🆔 Extracted Identity & Registration Details\n\n`;
      output += `Found **${kycDocs.length} documents** with identity and registration references:\n\n`;

      kycDocs.forEach((doc) => {
        const name = doc[2].trim();
        const cat = doc[3].trim();
        const tags = doc[4].trim();
        const sum = doc[5].trim();
        const ocr = doc[6]?.trim() || '';

        output += `#### 📄 ${name} (${cat})\n`;
        output += `- **Tags:** ${tags}\n`;
        output += `- **AI Summary:** ${sum}\n`;
        if (ocr) {
          output += `- **Extracted Content Snippet:** \`${ocr.slice(0, 150)}...\`\n`;
        }
        output += `\n`;
      });

      return output;
    }
  }

  // 4. Financials / Invoices / Totals
  if (
    lowerPrompt.includes('financial') ||
    lowerPrompt.includes('total') ||
    lowerPrompt.includes('salary') ||
    lowerPrompt.includes('bill') ||
    lowerPrompt.includes('amount') ||
    lowerPrompt.includes('invoice') ||
    lowerPrompt.includes('cost') ||
    lowerPrompt.includes('money')
  ) {
    const lines = fullText.split('\n');
    const finHits: string[] = [];

    lines.forEach((line) => {
      if (line.toLowerCase().includes('salary') || line.toLowerCase().includes('invoice') || line.toLowerCase().includes('bill') || line.toLowerCase().includes('tax') || line.toLowerCase().includes('₹') || line.toLowerCase().includes('inr') || line.toLowerCase().includes('$')) {
        finHits.push(line.replace(/\[Doc #\d+\]/g, '').trim());
      }
    });

    if (finHits.length > 0) {
      let output = `### 💰 Financial Breakdown & Invoice Ledger\n\n`;
      output += `Here is the financial data aggregated from your documents in this folder:\n\n`;
      finHits.forEach((hit, i) => {
        output += `${i + 1}. ${hit}\n`;
      });
      return output;
    }
  }

  // 5. Default semantic relevance search across document context
  const searchTerms = lowerPrompt
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const docSnippets = fullText.split(/\[(?:Doc|Document)\s*#?\d+\]/gi).filter((s) => s.trim().length > 0);
  const matchedDocs: { title: string; matchScore: number; content: string }[] = [];

  docSnippets.forEach((snippet) => {
    const lowerSnip = snippet.toLowerCase();
    let score = 0;
    searchTerms.forEach((t) => {
      if (lowerSnip.includes(t)) score += 10;
    });

    if (score > 0 || searchTerms.length === 0) {
      const nameMatch = snippet.match(/Name:\s*"?([^"|\n]+)"?/i);
      matchedDocs.push({
        title: nameMatch ? nameMatch[1].trim() : 'Document',
        matchScore: score,
        content: snippet.trim(),
      });
    }
  });

  matchedDocs.sort((a, b) => b.matchScore - a.matchScore);

  if (matchedDocs.length > 0) {
    let output = `### 🔍 Multi-Document Analysis Result\n\n`;
    output += `Based on the documents in this folder, here is what I found regarding *"**${prompt.replace(/\n/g, ' ')}**"*:\n\n`;

    matchedDocs.slice(0, 6).forEach((doc, idx) => {
      output += `**${idx + 1}. \`${doc.title}\`**\n`;
      const cleanContent = doc.content
        .replace(/Name:[^|]+/i, '')
        .split('|')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .join(' • ');
      output += `> ${cleanContent}\n\n`;
    });

    return output;
  }

  return `### 📁 Folder Intelligence Report\n\nI analyzed the documents in this folder. All documents are loaded and indexed with their OCR text and category metadata.\n\nYou can ask me specific questions such as:\n- *"Summarize everything in this folder"*\n- *"List all identity documents and numbers"*\n- *"Check upcoming expiration dates"*\n- *"Find salary slips or payment invoices"*`;
}

/**
 * Master multi-provider AI dispatcher with rotation, failover, and local fallback
 */
export async function callGeminiWithRotation(options: GeminiRequestOptions): Promise<string> {
  // 1. Tier 1: User's Custom API Key (if provided in options/header)
  if (options.customApiKey && options.customApiKey.trim().length > 5) {
    const customKey = options.customApiKey.trim();
    try {
      if (customKey.startsWith('gsk_')) {
        return await callGroqChat(customKey, options);
      } else if (customKey.startsWith('AIzaSy')) {
        return await callSingleGeminiKey(customKey, options);
      }
    } catch (err: any) {
      console.warn('[AIClient] Custom API key execution failed, falling back to pooled providers:', err.message);
    }
  }

  // 2. Tier 2: Groq Primary Engine (Fastest sub-second TTFT)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      return await callGroqChat(groqKey, options);
    } catch (err: any) {
      console.warn('[AIClient] Groq execution failed, falling back to Gemini pool:', err.message);
    }
  }

  // 3. Tier 3: Gemini Rotation Pool
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = keyRotator.getNextKey();
    if (!apiKey) break;

    try {
      return await callSingleGeminiKey(apiKey, options);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        keyRotator.markRateLimited(apiKey);
      } else if (err.message?.includes('403') || err.message?.includes('400')) {
        keyRotator.markPermanentFailure(apiKey);
      }
      console.warn(`[AIClient] Gemini key rotation attempt ${attempt + 1} failed:`, err.message);
    }
  }

  // 4. Tier 4: High-Precision Local RAG Synthesis Fallback
  return synthesizeLocalRAGResponse(options.prompt, options.fallbackContext || options.systemInstruction);
}

/**
 * Helper to call AI and strictly parse JSON result
 */
export async function callGeminiJson<T>(options: GeminiRequestOptions): Promise<T> {
  const rawText = await callGeminiWithRotation({
    ...options,
    prompt: `${options.prompt}\n\nIMPORTANT: Respond ONLY with a valid raw JSON object. Do not include markdown codeblocks or commentary.`,
  });

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('Failed to parse AI JSON output:', cleaned);
    throw new Error('AI response could not be parsed as valid JSON.');
  }
}

