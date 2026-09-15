import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory vault storage for burn shares with auto-expiry
const shareVault = new Map<string, {
  data: string;
  iv: string;
  name: string;
  mimeType: string;
  expiresAt: number;
  burnOnRead: boolean;
}>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, data, iv, name, mimeType, burnOnRead = true, ttlMinutes = 60 } = body;

    if (!id || !data || !iv) {
      return NextResponse.json({ error: 'Missing required payload' }, { status: 400 });
    }

    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    shareVault.set(id, { data, iv, name, mimeType, expiresAt, burnOnRead });

    return NextResponse.json({ success: true, id, expiresAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !shareVault.has(id)) {
    return NextResponse.json({ error: 'Share expired or already burned.' }, { status: 404 });
  }

  const item = shareVault.get(id)!;
  if (Date.now() > item.expiresAt) {
    shareVault.delete(id);
    return NextResponse.json({ error: 'Share expired.' }, { status: 410 });
  }

  // If burn-on-read, delete immediately from server vault
  if (item.burnOnRead) {
    shareVault.delete(id);
  }

  return NextResponse.json({
    data: item.data,
    iv: item.iv,
    name: item.name,
    mimeType: item.mimeType,
  });
}
