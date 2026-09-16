import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { streamSessionFile } from '@/lib/sessions/server-sessions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const stream = await streamSessionFile(auth.userId, id);
    if (!stream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('[API /api/sessions/[id]/file] GET Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch session file' }, { status: 500 });
  }
}
