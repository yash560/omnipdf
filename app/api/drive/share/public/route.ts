import { NextRequest, NextResponse } from 'next/server';
import { getPublicSharedItem } from '@/lib/drive/server-drive';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const password = searchParams.get('password') || undefined;

    if (!id) {
      return NextResponse.json({ error: 'Missing share id parameter' }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(req);
    const result = await getPublicSharedItem(id, password, auth?.userId, auth?.email);

    if (result.passwordRequired) {
      return NextResponse.json({
        passwordRequired: true,
        error: result.error || null,
      });
    }

    if (result.expired) {
      return NextResponse.json({ error: result.error || 'Share expired' }, { status: 410 });
    }

    if (result.error || !result.item) {
      return NextResponse.json({ error: result.error || 'Item not found' }, { status: 404 });
    }

    const item = result.item;

    // Sanitize item response for public view
    const publicItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      mimeType: item.mimeType,
      size: item.size,
      extension: item.extension,
      category: item.category,
      updatedAt: item.updatedAt,
      ownerName: item.ownerName || 'FileCraft User',
      shareConfig: {
        allowDownload: item.shareConfig?.allowDownload !== false,
        expiresAt: item.shareConfig?.expiresAt,
        viewCount: item.shareConfig?.viewCount || 0,
      },
    };

    return NextResponse.json({ success: true, item: publicItem });
  } catch (err: any) {
    console.error('[API /api/drive/share/public] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
