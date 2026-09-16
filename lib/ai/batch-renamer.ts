import { callGeminiJson } from './gemini-client';

export interface RenameSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export async function suggestSmartRenames(
  fileNames: string[],
  userInstruction: string = 'Standardize into Clean_Snake_Case or YYYY-MM-DD_Category_Name'
): Promise<RenameSuggestion[]> {
  const prompt = `You are an automated file organization agent. 
Given this list of filenames:
${JSON.stringify(fileNames)}

Apply this naming rule: "${userInstruction}"
Preserve the exact file extension (.pdf, .jpg, .docx, etc.).

Return ONLY a valid JSON array of objects:
[
  {"original": "IMG_20240912_WA0032.jpg", "suggested": "2024-09-12_WhatsApp_Photo_01.jpg", "reason": "Extracted date and normalized format"}
]`;

  try {
    return await callGeminiJson<RenameSuggestion[]>({
      prompt,
      systemInstruction: 'You are an expert file archivist. Respond strictly with valid JSON array of rename suggestions.',
      temperature: 0.1,
    });
  } catch {
    return fileNames.map((name) => ({
      original: name,
      suggested: name.replace(/\s+/g, '_'),
      reason: 'Replaced spaces with underscore',
    }));
  }
}

