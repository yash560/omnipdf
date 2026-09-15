import { keyRotator } from './gemini-key-rotator';

export interface MeetingSummaryResult {
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  keyTopics: string[];
}

export async function summarizeAudioMeeting(
  audioBase64: string,
  mimeType = 'audio/mp3'
): Promise<MeetingSummaryResult> {
  const apiKey = keyRotator.getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert executive meeting assistant. Listen to this audio recording and extract structured meeting minutes.
Return ONLY valid JSON with this exact structure:
{
  "executiveSummary": "A concise paragraph summarizing the meeting discussions and overall outcome.",
  "keyDecisions": ["Decided to launch beta on Oct 15", "Approved marketing budget of $5k"],
  "actionItems": [
    {"task": "Prepare pitch deck slides", "owner": "Yash", "deadline": "Friday"}
  ],
  "keyTopics": ["Product Roadmap", "Infrastructure Architecture", "User Onboarding"]
}`;

  const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '').trim();

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
    throw new Error(`Gemini Audio Summary failed with status ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    return {
      executiveSummary: rawText,
      keyDecisions: ['Review audio recording for details.'],
      actionItems: [{ task: 'Follow up on recorded audio notes', owner: 'Team', deadline: 'ASAP' }],
      keyTopics: ['General Audio Note'],
    };
  }
}
