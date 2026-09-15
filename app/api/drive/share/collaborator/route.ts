import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { addCollaborator, removeCollaborator } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, email, role } = body;

    if (!itemId || !email) {
      return NextResponse.json({ error: 'Missing itemId or email' }, { status: 400 });
    }

    const updatedItem = await addCollaborator(auth.userId, itemId, email, role || 'viewer');

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (err: any) {
    console.error('[API /api/drive/share/collaborator] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add collaborator' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, email } = await req.json();

    if (!itemId || !email) {
      return NextResponse.json({ error: 'Missing itemId or email' }, { status: 400 });
    }

    const updatedItem = await removeCollaborator(auth.userId, itemId, email);

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (err: any) {
    console.error('[API /api/drive/share/collaborator DELETE] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to remove collaborator' }, { status: 500 });
  }
}
