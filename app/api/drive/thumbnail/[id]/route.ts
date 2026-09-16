import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudFileStream, getCloudItem } from '@/lib/drive/server-drive';
import { getStoredThumbnail, saveThumbnail } from '@/lib/drive/thumbnail-store';
import { renderPdfFirstPageToPng, PDF_THUMBNAIL_CANONICAL_WIDTH } from '@/lib/drive/pdf-thumbnail-render';
import sharp from 'sharp';

// Caps how long a cache-miss PDF render (first-ever viewer of an old file) can
// hold the request open. On timeout we 404, which the client already treats
// as "no preview available" and falls back to the category icon.
const PDF_RENDER_TIMEOUT_MS = 8000;

function webpHeaders(etag: string, buffer: Buffer) {
  return {
    'Content-Type': 'image/webp',
    'Content-Length': buffer.length.toString(),
    'ETag': etag,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
}

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

    const item = await getCloudItem(userId, id, userEmail);
    if (!item || item.type === 'folder') {
      return new NextResponse('File not found or access denied', { status: 404 });
    }

    const etag = `W/"thumb-${item.id}-${targetWidth}-${item.updatedAt || item.createdAt}"`;
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { 'ETag': etag, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }

    const isPdf = item.category === 'pdf' || item.extension === 'pdf';

    if (isPdf) {
      // Fast path: server-rendered page-1 raster already cached — no GridFS
      // fetch of the original file needed at all, just a cheap resize.
      const cached = await getStoredThumbnail(item.id, PDF_THUMBNAIL_CANONICAL_WIDTH);
      if (cached) {
        const resized = await sharp(cached)
          .resize({ width: targetWidth, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 78, effort: 4 })
          .toBuffer();
        return new NextResponse(resized, { status: 200, headers: webpHeaders(etag, resized) });
      }

      // Cache miss (pre-existing PDF from before this feature, or background
      // generation hasn't landed yet): render once, on-demand, store for next time.
      const fileData = await getCloudFileStream(userId, id, userEmail);
      if (!fileData) {
        return new NextResponse('File not found or access denied', { status: 404 });
      }
      const chunks: Buffer[] = [];
      for await (const chunk of fileData.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const inputBuffer = Buffer.concat(chunks);

      const png = await Promise.race([
        renderPdfFirstPageToPng(inputBuffer),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), PDF_RENDER_TIMEOUT_MS)),
      ]);

      if (!png) {
        // Corrupt/encrypted/too-slow PDF — 404 so the client's existing
        // onError handler keeps showing the category icon, not a broken image.
        return new NextResponse(null, { status: 404 });
      }

      const canonicalWebp = await sharp(png)
        .resize({ width: PDF_THUMBNAIL_CANONICAL_WIDTH, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 78, effort: 4 })
        .toBuffer();

      // Don't block this response on the write — every viewer after this one hits the fast path.
      saveThumbnail(item.id, PDF_THUMBNAIL_CANONICAL_WIDTH, canonicalWebp).catch(() => {});

      const resized =
        targetWidth === PDF_THUMBNAIL_CANONICAL_WIDTH
          ? canonicalWebp
          : await sharp(canonicalWebp)
              .resize({ width: targetWidth, withoutEnlargement: true, fit: 'inside' })
              .webp({ quality: 78, effort: 4 })
              .toBuffer();

      return new NextResponse(resized, { status: 200, headers: webpHeaders(etag, resized) });
    }

    // Non-PDF path — unchanged image/generic handling.
    const fileData = await getCloudFileStream(userId, id, userEmail);
    if (!fileData) {
      return new NextResponse('File not found or access denied', { status: 404 });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of fileData.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const inputBuffer = Buffer.concat(chunks);

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

    try {
      const thumbnailBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({ width: targetWidth, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 78, effort: 4 })
        .toBuffer();

      return new NextResponse(thumbnailBuffer, { status: 200, headers: webpHeaders(etag, thumbnailBuffer) });
    } catch {
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
