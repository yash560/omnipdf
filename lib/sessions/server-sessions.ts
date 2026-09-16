import { getMongoDb } from '@/lib/db/mongodb';
import { GridFSBucket } from 'mongodb';

const SESSIONS_COLLECTION = 'filecraft_studio_sessions';
const BUCKET_NAME = 'filecraft_studio_storage';

async function getStorageBucket(): Promise<GridFSBucket> {
  const db = await getMongoDb();
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

let indexesCreated = false;
async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;
  indexesCreated = true;

  // Run in background so request execution is instant
  (async () => {
    try {
      const db = await getMongoDb();
      const col = db.collection(SESSIONS_COLLECTION);
      await Promise.allSettled([
        col.createIndex({ userId: 1, lastModified: -1 }),
        col.createIndex({ _id: 1, userId: 1 }),
      ]);
    } catch (err) {
      console.warn('[ServerSessions] Non-blocking index creation notice:', err);
    }
  })();
}

export async function createSession(
  userId: string,
  meta: Record<string, any>,
  pdfBuffer: Buffer
): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);
  const bucket = await getStorageBucket();

  const sessionId: string = meta.id;

  const uploadStream = bucket.openUploadStream(sessionId, {
    metadata: { userId, createdAt: Date.now() },
  });
  await new Promise<void>((resolve, reject) => {
    uploadStream.on('finish', () => resolve());
    uploadStream.on('error', (err) => reject(err));
    uploadStream.end(pdfBuffer);
  });

  const { pdfData, ...cleanMeta } = meta;

  await col.updateOne(
    { _id: sessionId as any },
    {
      $set: {
        ...cleanMeta,
        userId,
        size: cleanMeta.size ?? pdfBuffer.length,
        lastModified: Date.now(),
      },
    },
    { upsert: true }
  );
}

export async function updateSessionMeta(
  userId: string,
  sessionId: string,
  patch: Record<string, any>
): Promise<boolean> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);

  const { _id, userId: _u, id, ...safePatch } = patch;

  const res = await col.updateOne(
    { _id: sessionId as any, userId },
    { $set: { ...safePatch, lastModified: Date.now() } }
  );

  return res.matchedCount > 0;
}

export async function listSessions(userId: string): Promise<any[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);

  const docs = await col.find({ userId }).sort({ lastModified: -1 }).toArray();
  return docs.map((d) => ({ ...d, id: d._id }));
}

export async function getSessionMeta(userId: string, sessionId: string): Promise<any | null> {
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);

  const doc = await col.findOne({ _id: sessionId as any, userId });
  if (!doc) return null;
  return { ...doc, id: doc._id };
}

export async function streamSessionFile(
  userId: string,
  sessionId: string
): Promise<NodeJS.ReadableStream | null> {
  const meta = await getSessionMeta(userId, sessionId);
  if (!meta) return null;

  const bucket = await getStorageBucket();
  return bucket.openDownloadStreamByName(sessionId);
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);
  const bucket = await getStorageBucket();

  await col.deleteOne({ _id: sessionId as any, userId });

  try {
    const files = await bucket.find({ filename: sessionId }).toArray();
    for (const file of files) {
      await bucket.delete(file._id).catch(() => {});
    }
  } catch {
    // ignore individual delete misses
  }
}

export async function clearAllSessions(userId: string): Promise<void> {
  const db = await getMongoDb();
  const col = db.collection(SESSIONS_COLLECTION);
  const bucket = await getStorageBucket();

  const docs = await col.find({ userId }).toArray();
  const ids = docs.map((d) => String(d._id));

  await col.deleteMany({ userId });

  for (const id of ids) {
    try {
      const files = await bucket.find({ filename: id }).toArray();
      for (const file of files) {
        await bucket.delete(file._id).catch(() => {});
      }
    } catch {
      // ignore individual delete misses
    }
  }
}
