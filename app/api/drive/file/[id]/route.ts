import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudFileStream } from '@/lib/drive/server-drive';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const fileData = await getCloudFileStream(auth.userId, id);

    if (!fileData) {
      return new NextResponse('File not found', { status: 404 });
    }

    const { stream, item } = fileData;

    // Convert NodeJS Readable Stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    const isInline = req.nextUrl.searchParams.get('download') !== '1';
    const disposition = isInline
      ? `inline; filename="${encodeURIComponent(item.name)}"`
      : `attachment; filename="${encodeURIComponent(item.name)}"`;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': item.mimeType || 'application/octet-stream',
        'Content-Disposition': disposition,
        'Content-Length': item.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[API /api/drive/file/[id]] Error:', err);
    return new NextResponse(err.message || 'Failed to stream file', { status: 500 });
  }
}
