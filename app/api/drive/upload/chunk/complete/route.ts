import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { completeChunkUploadSession } from '@/lib/drive/server-drive';
import { driveLiveBus } from '@/lib/drive/live-bus';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json({ error: 'Missing uploadId parameter' }, { status: 400 });
    }

    const item = await completeChunkUploadSession(auth.userId, uploadId);
    driveLiveBus.broadcast(auth.userId, 'item_created', { itemId: item.id, parentId: item.parentId, data: item });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error('[API /api/drive/upload/chunk/complete] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to complete chunk upload' }, { status: 500 });
  }
}
