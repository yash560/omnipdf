import { NextRequest, NextResponse } from 'next/server';
import { extractTableFromImage } from '@/lib/ai/table-extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType } = body;

    if (!image) {
      return NextResponse.json({ error: 'Base64 image required' }, { status: 400 });
    }

    const result = await extractTableFromImage(image, mimeType);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
