import { getMongoDb } from '@/lib/db/mongodb';

const THUMBNAILS_COLLECTION = 'filecraft_drive_thumbnails';

interface ThumbnailDoc {
  itemId: string;
  width: number;
  mimeType: string;
  data: Buffer;
  createdAt: number;
}

let thumbIndexesCreated = false;
async function ensureThumbnailIndexes() {
  if (thumbIndexesCreated) return;
  thumbIndexesCreated = true;
  try {
    const db = await getMongoDb();
    await db
      .collection(THUMBNAILS_COLLECTION)
      .createIndex({ itemId: 1, width: 1 }, { unique: true })
      .catch(() => {});
  } catch (err) {
    console.warn('[ThumbnailStore] Index creation warning:', err);
  }
}

/**
 * Fetch a cached server-rendered thumbnail (e.g. PDF page 1) for an item.
 * Returns null on cache miss — caller is responsible for generating + saving.
 */
export async function getStoredThumbnail(itemId: string, width: number): Promise<Buffer | null> {
  await ensureThumbnailIndexes();
  const db = await getMongoDb();
  const doc = await db
    .collection<ThumbnailDoc>(THUMBNAILS_COLLECTION)
    .findOne({ itemId, width });
  if (!doc) return null;
  return doc.data.buffer ? Buffer.from(doc.data.buffer as any) : Buffer.from(doc.data as any);
}

/**
 * Persist a rendered thumbnail so future requests (any viewer, any device) skip
 * the expensive render step entirely.
 */
export async function saveThumbnail(itemId: string, width: number, data: Buffer, mimeType = 'image/webp'): Promise<void> {
  await ensureThumbnailIndexes();
  const db = await getMongoDb();
  await db.collection<ThumbnailDoc>(THUMBNAILS_COLLECTION).updateOne(
    { itemId, width },
    { $set: { itemId, width, mimeType, data, createdAt: Date.now() } },
    { upsert: true }
  );
}

/**
 * Remove all cached thumbnail widths for an item — call when the underlying
 * file content is replaced or the item is permanently deleted.
 */
export async function deleteThumbnail(itemId: string): Promise<void> {
  await ensureThumbnailIndexes();
  const db = await getMongoDb();
  await db.collection(THUMBNAILS_COLLECTION).deleteMany({ itemId }).catch(() => {});
}
