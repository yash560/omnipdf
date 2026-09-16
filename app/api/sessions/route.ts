import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { createSession, listSessions, clearAllSessions } from '@/lib/sessions/server-sessions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const metaRaw = formData.get('meta') as string | null;
    if (!file || !metaRaw) {
      return NextResponse.json({ error: 'Missing file or meta' }, { status: 400 });
    }

    const meta = JSON.parse(metaRaw);
    const buffer = Buffer.from(await file.arrayBuffer());

    await createSession(auth.userId, meta, buffer);

    return NextResponse.json({ success: true, id: meta.id });
  } catch (err: any) {
    console.error('[API /api/sessions] POST Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await listSessions(auth.userId);
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    console.error('[API /api/sessions] GET Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clearAllSessions(auth.userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/sessions] DELETE Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to clear sessions' }, { status: 500 });
  }
}
