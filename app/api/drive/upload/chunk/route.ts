import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { saveUploadChunk } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const uploadId = formData.get('uploadId') as string;
    const chunkIndexStr = formData.get('chunkIndex') as string;
    const file = formData.get('chunk') as File;

    if (!uploadId || chunkIndexStr === null || !file) {
      return NextResponse.json({ error: 'Missing chunk payload' }, { status: 400 });
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const arrayBuffer = await file.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    const result = await saveUploadChunk(auth.userId, uploadId, chunkIndex, chunkBuffer);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/drive/upload/chunk] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save upload chunk' }, { status: 500 });
  }
}
