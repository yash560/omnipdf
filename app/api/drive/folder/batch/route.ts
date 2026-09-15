import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { createBatchFolders } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paths, baseParentId } = body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'Invalid paths array' }, { status: 400 });
    }

    const folderMap = await createBatchFolders(auth.userId, paths, baseParentId || null);

    return NextResponse.json({ success: true, folderMap });
  } catch (err: any) {
    console.error('[API /api/drive/folder/batch] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create batch folders' }, { status: 500 });
  }
}
