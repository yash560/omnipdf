import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getUploadChunkStatus } from '@/lib/drive/server-drive';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadId = req.nextUrl.searchParams.get('uploadId');
    if (!uploadId) {
      return NextResponse.json({ error: 'Missing uploadId parameter' }, { status: 400 });
    }

    const status = await getUploadChunkStatus(auth.userId, uploadId);
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    console.error('[API /api/drive/upload/chunk/status] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get upload status' }, { status: 500 });
  }
}
