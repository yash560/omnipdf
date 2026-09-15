import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { updateShareConfig } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, isPublic, allowDownload, expiresAt, hasPassword, passwordHash, maxDownloads } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId parameter' }, { status: 400 });
    }

    const updatedItem = await updateShareConfig(auth.userId, itemId, {
      isPublic: Boolean(isPublic),
      allowDownload: allowDownload !== undefined ? Boolean(allowDownload) : true,
      expiresAt: expiresAt || null,
      hasPassword: Boolean(hasPassword),
      passwordHash: passwordHash || undefined,
      maxDownloads: maxDownloads || null,
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (err: any) {
    console.error('[API /api/drive/share/link] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update share config' }, { status: 500 });
  }
}
