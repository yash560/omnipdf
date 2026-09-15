import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJson, callGeminiWithRotation } from '@/lib/ai/gemini-client';
import { keyRotator } from '@/lib/ai/gemini-key-rotator';
import { Annotation } from '@/types/pdf';

interface AutoFillField {
  label?: string;
  text: string;
  x: number; // percentage (0 to 100) or pixel
  y: number; // percentage (0 to 100) or pixel
  width?: number;
  height?: number;
  fontSize?: number;
  isCheckbox?: boolean;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    poolStatus: keyRotator.getPoolStatus(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pageImage, userPrompt, userContext, viewport, piiTypes } = body;

    const width = viewport?.width || 612;
    const height = viewport?.height || 792;

    // 1. AUTO-FILL FORM FIELDS
    if (action === 'auto-fill-form') {
      const systemInstruction = `You are an expert Document Vision AI specialized in analyzing PDF forms, invoices, applications, contracts, and tax documents.
Your task is to visually detect all empty fields, form blanks, underline areas, boxes, or lines on the provided document image and populate them accurately using the provided user data/context.

Coordinates rules:
- Return 'x' and 'y' as exact PIXEL coordinates matching the document dimensions (Width: ${width}px, Height: ${height}px).
- 'x' is the horizontal distance from the left edge (0 to ${width}).
- 'y' is the vertical distance from the top edge (0 to ${height}).
- Set 'fontSize' appropriately (typically between 12 and 16).
- Return an array of filled field items.`;

      const prompt = `Analyze this document image and fill out all appropriate form fields with the following data context:
Context: ${userContext || userPrompt || 'Standard personal and business details'}

Return ONLY a JSON object with this exact schema:
{
  "fields": [
    {
      "label": "Field description or detected label",
      "text": "Filled value",
      "x": 150,
      "y": 240,
      "width": 200,
      "height": 24,
      "fontSize": 14,
      "isCheckbox": false
    }
  ],
  "summary": "Brief explanation of fields filled"
}`;

      const result = await callGeminiJson<{ fields: AutoFillField[]; summary?: string }>({
        prompt,
        systemInstruction,
        imageBase64: pageImage,
        temperature: 0.1,
      });

      // Map to OmniPDF TextAnnotations
      const annotations: Annotation[] = (result.fields || []).map((f, idx) => {
        const fontSize = f.fontSize || 14;
        const estimatedWidth = Math.max(60, f.width || (f.text.length * fontSize * 0.65));
        const estimatedHeight = Math.max(24, f.height || (fontSize * 1.6));
        return {
          id: `ai-text-${Date.now()}-${idx}`,
          type: 'text' as const,
          pageIndex: (viewport?.pageIndex || 1) - 1,
          x: Math.max(0, Math.min(width - 50, f.x)),
          y: Math.max(0, Math.min(height - 20, f.y)),
          width: estimatedWidth,
          height: estimatedHeight,
          text: f.text || '',
          fontSize,
          fontFamily: 'Plus Jakarta Sans',
          color: '#1e293b', // Crisp slate dark ink
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          textTransform: 'none',
          textAlign: 'left',
          opacity: 1,
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#3b82f6',
          borderStyle: 'solid',
          borderRadius: 4,
        };
      });

      return NextResponse.json({
        success: true,
        annotations,
        summary: result.summary || `Auto-filled ${annotations.length} fields successfully.`,
        poolStatus: keyRotator.getPoolStatus(),
      });
    }

    // 2. PROMPT-TO-EDIT & CONTENT INSERTION
    if (action === 'prompt-edit') {
      const systemInstruction = `You are an interactive AI PDF Design Assistant.
The user wants to visually edit, add stamps, insert summaries, signatures, translations, or notes on this document page.
Document Dimensions: Width: ${width}px, Height: ${height}px.

Interpret the user's prompt and determine:
1. What text or elements to add.
2. The optimal location (x, y coordinates in pixels) on the page where it won't collide with existing printed text unless intended.
3. Appropriate styling (colors, font size, bold, border, background fill).`;

      const prompt = `User Instruction: "${userPrompt}"
Analyze the document visual layout and generate the required annotations.

Return ONLY a JSON object with this exact schema:
{
  "annotations": [
    {
      "type": "text",
      "text": "The generated text or note",
      "x": 100,
      "y": 150,
      "fontSize": 14,
      "fontFamily": "Plus Jakarta Sans",
      "color": "#0f172a",
      "bold": false,
      "italic": false,
      "underline": false,
      "textAlign": "left",
      "fillColor": "#fef08a",
      "borderWidth": 1,
      "borderColor": "#eab308",
      "borderRadius": 8,
      "opacity": 1
    }
  ],
  "description": "Explanation of changes made"
}`;

      const result = await callGeminiJson<{ annotations: any[]; description?: string }>({
        prompt,
        systemInstruction,
        imageBase64: pageImage,
        temperature: 0.2,
      });

      const formattedAnnotations: Annotation[] = (result.annotations || []).map((a, idx) => {
        const fontSize = a.fontSize || 14;
        const textVal = a.text || 'AI Note';
        const estimatedWidth = Math.max(80, a.width || (textVal.length * fontSize * 0.65));
        const estimatedHeight = Math.max(28, a.height || (fontSize * 1.8));
        return {
          id: `ai-prompt-${Date.now()}-${idx}`,
          type: 'text' as const,
          pageIndex: (viewport?.pageIndex || 1) - 1,
          x: Math.max(0, Math.min(width - 60, a.x || 50)),
          y: Math.max(0, Math.min(height - 30, a.y || 50)),
          width: estimatedWidth,
          height: estimatedHeight,
          text: textVal,
          fontSize,
          fontFamily: a.fontFamily || 'Plus Jakarta Sans',
          color: a.color || '#0f172a',
          bold: !!a.bold,
          italic: !!a.italic,
          underline: !!a.underline,
          strikethrough: false,
          textTransform: 'none',
          textAlign: a.textAlign || 'left',
          opacity: a.opacity ?? 1,
          backgroundColor: a.fillColor || 'transparent',
          borderWidth: a.borderWidth ?? 0,
          borderColor: a.borderColor || '#3b82f6',
          borderStyle: 'solid',
          borderRadius: a.borderRadius ?? 4,
        };
      });

      return NextResponse.json({
        success: true,
        annotations: formattedAnnotations,
        description: result.description || 'AI edits applied.',
        poolStatus: keyRotator.getPoolStatus(),
      });
    }

    // 3. SMART AI PII REDACTION
    if (action === 'ai-redact-pii') {
      const systemInstruction = `You are a high-precision Privacy and PII Redaction Vision AI.
Identify all sensitive Personally Identifiable Information on this page, including:
${(piiTypes || ['Social Security Numbers', 'Credit Card Numbers', 'Email Addresses', 'Phone Numbers', 'Personal Physical Addresses', 'Financial Account Numbers', 'Signatures']).join(', ')}.

Calculate the exact bounding box rectangles (x, y, width, height in pixels) for each piece of sensitive data on the document (Width: ${width}px, Height: ${height}px).`;

      const prompt = `Locate all sensitive PII bounding boxes on this document image.

Return ONLY a JSON object with this exact schema:
{
  "redactions": [
    {
      "label": "Phone Number",
      "x": 240,
      "y": 180,
      "width": 120,
      "height": 18
    }
  ],
  "detectedCount": 1
}`;

      const result = await callGeminiJson<{ redactions: any[]; detectedCount: number }>({
        prompt,
        systemInstruction,
        imageBase64: pageImage,
        temperature: 0.1,
      });

      const redactions: Annotation[] = (result.redactions || []).map((r, idx) => ({
        id: `ai-redact-${Date.now()}-${idx}`,
        type: 'redact' as const,
        pageIndex: (viewport?.pageIndex || 1) - 1,
        x: Math.max(0, r.x),
        y: Math.max(0, r.y),
        width: Math.max(20, r.width || 80),
        height: Math.max(12, r.height || 18),
        fillColor: '#000000',
        opacity: 1,
      }));

      return NextResponse.json({
        success: true,
        annotations: redactions,
        detectedCount: redactions.length,
        poolStatus: keyRotator.getPoolStatus(),
      });
    }

    // 4. EXECUTIVE SUMMARY & PAGE ANALYSIS
    if (action === 'ai-summarize-page') {
      const prompt = `Analyze this PDF page. Provide:
1. Executive Summary (2-3 concise sentences)
2. Key Action Items & Entities
3. Risk / Attention Flags (if any)
4. Formatted Markdown Sticky Note content`;

      const text = await callGeminiWithRotation({
        prompt,
        imageBase64: pageImage,
        temperature: 0.2,
      });

      return NextResponse.json({
        success: true,
        summaryText: text,
        poolStatus: keyRotator.getPoolStatus(),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('AI Page Edit API Error:', err);
    return NextResponse.json(
      { error: err.message || 'AI processing failed' },
      { status: 500 }
    );
  }
}
