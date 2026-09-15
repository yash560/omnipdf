import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { initChunkUploadSession } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileSize, mimeType, totalChunks, chunkSize, parentId, relativePath } = body;

    if (!fileName || !fileSize || !totalChunks || !chunkSize) {
      return NextResponse.json({ error: 'Missing required upload parameters' }, { status: 400 });
    }

    const session = await initChunkUploadSession(auth.userId, {
      fileName,
      fileSize,
      mimeType: mimeType || 'application/octet-stream',
      totalChunks,
      chunkSize,
      parentId: parentId || null,
      relativePath,
    });

    return NextResponse.json({ success: true, ...session });
  } catch (err: any) {
    console.error('[API /api/drive/upload/chunk/init] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to init chunk upload' }, { status: 500 });
  }
}
