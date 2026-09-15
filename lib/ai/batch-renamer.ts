import { keyRotator } from './gemini-key-rotator';

export interface RenameSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export async function suggestSmartRenames(
  fileNames: string[],
  userInstruction: string = 'Standardize into Clean_Snake_Case or YYYY-MM-DD_Category_Name'
): Promise<RenameSuggestion[]> {
  const apiKey = keyRotator.getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an automated file organization agent. 
Given this list of filenames:
${JSON.stringify(fileNames)}

Apply this naming rule: "${userInstruction}"
Preserve the exact file extension (.pdf, .jpg, .docx, etc.).

Return ONLY a valid JSON array of objects:
[
  {"original": "IMG_20240912_WA0032.jpg", "suggested": "2024-09-12_WhatsApp_Photo_01.jpg", "reason": "Extracted date and normalized format"}
]`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) keyRotator.markRateLimited(apiKey);
    throw new Error(`Gemini rename failed with status ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const cleanJson = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    return fileNames.map((name) => ({
      original: name,
      suggested: name.replace(/\s+/g, '_'),
      reason: 'Replaced spaces with underscore',
    }));
  }
}
