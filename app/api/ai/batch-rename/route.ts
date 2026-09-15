import { NextRequest, NextResponse } from 'next/server';
import { suggestSmartRenames } from '@/lib/ai/batch-renamer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileNames, instruction } = body;

    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json({ error: 'File names array required' }, { status: 400 });
    }

    const suggestions = await suggestSmartRenames(fileNames, instruction);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
