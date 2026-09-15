import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudFileStreamWithRange } from '@/lib/drive/server-drive';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    // Allow guest access if token query or public share
    const userId = auth?.userId || 'guest';
    const userEmail = auth?.email;

    const { id } = await params;
    const rangeHeader = req.headers.get('range');
    const ifNoneMatch = req.headers.get('if-none-match');

    const fileData = await getCloudFileStreamWithRange(userId, id, rangeHeader, userEmail);

    if (!fileData) {
      return new NextResponse('File not found or access denied', { status: 404 });
    }

    const { stream, item, range } = fileData;
    const etag = `W/"fc-${item.id}-${item.size}-${item.updatedAt}"`;

    // Fast 304 Cache Hit
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=86400, must-revalidate',
          'Accept-Ranges': 'bytes',
        },
      });
    }

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

    if (range && range.isPartial) {
      const contentLength = range.end - range.start + 1;
      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': item.mimeType || 'application/octet-stream',
          'Content-Disposition': disposition,
          'Content-Range': `bytes ${range.start}-${range.end}/${range.total}`,
          'Content-Length': contentLength.toString(),
          'Accept-Ranges': 'bytes',
          'ETag': etag,
          'Cache-Control': 'public, max-age=86400, must-revalidate',
        },
      });
    }

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': item.mimeType || 'application/octet-stream',
        'Content-Disposition': disposition,
        'Content-Length': item.size.toString(),
        'Accept-Ranges': 'bytes',
        'ETag': etag,
        'Cache-Control': 'public, max-age=86400, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API /api/drive/file/[id]] Error:', err);
    return new NextResponse(err.message || 'Failed to stream file', { status: 500 });
  }
}

