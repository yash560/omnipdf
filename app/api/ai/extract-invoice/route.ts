import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJson } from '@/lib/ai/gemini-client';
import { ExtractedInvoice } from '@/lib/ai/invoice-extractor';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, fileName } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64 document scan' }, { status: 400 });
    }

    const systemInstruction = `You are a high-precision Financial Document Intelligence Parser.
Extract structured invoice/receipt/bill data from the document scan into strict JSON format with this exact TypeScript interface:
{
  "vendorName": string,
  "vendorGstin": string (optional),
  "vendorAddress": string (optional),
  "customerName": string (optional),
  "invoiceNumber": string,
  "invoiceDate": string,
  "dueDate": string (optional),
  "currency": string (e.g. "USD", "INR", "EUR"),
  "subtotal": number,
  "taxAmount": number,
  "discountAmount": number (optional),
  "totalAmount": number,
  "items": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "taxRatePercent": number (optional),
      "total": number
    }
  ]
}
If any numeric amount is missing or not explicitly stated, compute it accurately. Respond ONLY with valid JSON.`;

    const prompt = `Carefully inspect this document scan "${fileName || 'invoice.pdf'}" and extract all financial fields, totals, and table line items.`;

    const extracted = await callGeminiJson<ExtractedInvoice>({
      prompt,
      systemInstruction,
      imageBase64,
      mimeType: mimeType || 'image/jpeg',
      temperature: 0.1,
    });

    return NextResponse.json({ invoice: extracted });
  } catch (err: any) {
    console.error('Invoice extraction error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract invoice data' },
      { status: 500 }
    );
  }
}
