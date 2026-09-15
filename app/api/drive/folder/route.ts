import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { createCloudFolder } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, parentId = null, color = 'default' } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folder = await createCloudFolder(auth.userId, name.trim(), parentId, color);

    return NextResponse.json({
      success: true,
      folder,
      message: `Folder "${folder.name}" created`,
    });
  } catch (err: any) {
    console.error('[API /api/drive/folder] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create folder' }, { status: 500 });
  }
}
