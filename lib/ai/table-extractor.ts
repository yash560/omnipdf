import { keyRotator } from './gemini-key-rotator';

export interface ExtractedTableResult {
  headers: string[];
  rows: Record<string, any>[];
  rawJson: any;
}

export async function extractTableFromImage(base64Image: string, mimeType = 'image/jpeg'): Promise<ExtractedTableResult> {
  const apiKey = keyRotator.getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Extract all tabular data, line items, receipt items, or invoice entries from this image.
Return ONLY valid raw JSON with this exact schema:
{
  "headers": ["Item Description", "Quantity", "Unit Price", "Total Amount"],
  "rows": [
    {"Item Description": "Consulting Services", "Quantity": 1, "Unit Price": 500, "Total Amount": 500}
  ]
}
Do not include any Markdown ticks or text other than the JSON string.`;

  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '').trim();

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) keyRotator.markRateLimited(apiKey);
    throw new Error(`Gemini Vision responded with ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = rawText.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      headers: parsed.headers || Object.keys(parsed.rows?.[0] || {}),
      rows: parsed.rows || [],
      rawJson: parsed,
    };
  } catch {
    return {
      headers: ['Content'],
      rows: [{ Content: rawText }],
      rawJson: { raw: rawText },
    };
  }
}
