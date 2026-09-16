import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getSessionMeta, updateSessionMeta, deleteSession } from '@/lib/sessions/server-sessions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const meta = await getSessionMeta(auth.userId, id);
    if (!meta) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(meta);
  } catch (err: any) {
    console.error('[API /api/sessions/[id]] GET Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const patch = await req.json();
    const ok = await updateSessionMeta(auth.userId, id, patch);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/sessions/[id]] PATCH Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteSession(auth.userId, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/sessions/[id]] DELETE Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete session' }, { status: 500 });
  }
}
