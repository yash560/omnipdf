import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudFileStream } from '@/lib/drive/server-drive';
import sharp from 'sharp';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    const userId = auth?.userId || 'guest';
    const userEmail = auth?.email;

    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const requestedWidth = parseInt(searchParams.get('w') || '320', 10);
    const targetWidth = Math.min(800, Math.max(64, isNaN(requestedWidth) ? 320 : requestedWidth));

    const fileData = await getCloudFileStream(userId, id, userEmail);
    if (!fileData) {
      return new NextResponse('File not found or access denied', { status: 404 });
    }

    const { stream, item } = fileData;
    const etag = `W/"thumb-${item.id}-${targetWidth}-${item.updatedAt || item.createdAt}"`;

    // Fast 304 Not Modified check
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Collect stream chunks into buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const inputBuffer = Buffer.concat(chunks);

    // If SVG, return directly as SVG
    if (item.mimeType === 'image/svg+xml' || item.extension === 'svg') {
      return new NextResponse(inputBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Process image with Sharp
    try {
      const thumbnailBuffer = await sharp(inputBuffer)
        .rotate() // Auto-orient based on EXIF
        .resize({
          width: targetWidth,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 78, effort: 4 })
        .toBuffer();

      return new NextResponse(thumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': thumbnailBuffer.length.toString(),
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // If Sharp cannot process (e.g. corrupted format), fallback to original stream/buffer
      return new NextResponse(inputBuffer, {
        status: 200,
        headers: {
          'Content-Type': item.mimeType || 'application/octet-stream',
          'ETag': etag,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch (err: any) {
    console.error('[API /api/drive/thumbnail/[id]] Error:', err);
    return new NextResponse(err.message || 'Failed to generate thumbnail', { status: 500 });
  }
}
