import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { addDriveComment, getDriveComments, resolveDriveComment } from '@/lib/drive/server-drive';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = req.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }

    const comments = await getDriveComments(itemId);
    return NextResponse.json({ success: true, comments });
  } catch (err: any) {
    console.error('[API /api/drive/comments GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, content } = await req.json();
    if (!itemId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing itemId or content' }, { status: 400 });
    }

    const comment = await addDriveComment(auth.userId, itemId, content);
    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    console.error('[API /api/drive/comments POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add comment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, resolved } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
    }

    await resolveDriveComment(commentId, Boolean(resolved));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/drive/comments PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update comment' }, { status: 500 });
  }
}
