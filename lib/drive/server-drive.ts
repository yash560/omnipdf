import { getMongoDb } from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';
import { 
  DriveItem, 
  DriveCategory, 
  DriveFolderColor, 
  DriveStats, 
  DriveBreadcrumb,
  Collaborator,
  CollaboratorRole,
  ShareConfig,
  DriveComment,
  DriveActivity,
  DriveActivityAction,
  SearchFilterOptions,
  SearchResult
} from './drive-types';
import { categorizeFile } from './drive-helpers';
import { findUserByEmail, findUserById } from '@/lib/auth/db';
import { autoLabelFile, getHeuristicLabels } from '@/lib/ai/auto-labeler';
import { searchDriveItems } from './search-engine';
import { Readable } from 'stream';
import sharp from 'sharp';

const ITEMS_COLLECTION = 'filecraft_drive_items';
const BUCKET_NAME = 'filecraft_drive_storage';
const SESSIONS_COLLECTION = 'filecraft_upload_sessions';
const CHUNKS_COLLECTION = 'filecraft_upload_chunks';
const COMMENTS_COLLECTION = 'filecraft_drive_comments';
const ACTIVITY_COLLECTION = 'filecraft_drive_activity';

function generateId(prefix: string = 'fc'): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Get GridFS bucket instance
 */
async function getStorageBucket(): Promise<GridFSBucket> {
  const db = await getMongoDb();
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/**
 * Initialize indexes on all collections
 */
let indexesCreated = false;
async function ensureIndexes() {
  if (indexesCreated) return;
  indexesCreated = true;
  try {
    const db = await getMongoDb();
    const itemsCol = db.collection(ITEMS_COLLECTION);
    await itemsCol.createIndex({ userId: 1, parentId: 1, isTrash: 1 }).catch(() => {});
    await itemsCol.createIndex({ userId: 1, isStarred: 1, isTrash: 1 }).catch(() => {});
    await itemsCol.createIndex({ userId: 1, updatedAt: -1 }).catch(() => {});
    await itemsCol.createIndex({ userId: 1, category: 1, isTrash: 1 }).catch(() => {});
    await itemsCol.createIndex({ id: 1, userId: 1 }).catch(() => {});
    await itemsCol.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await itemsCol.createIndex({ ownerEmail: 1 }).catch(() => {});
    await itemsCol.createIndex({ 'sharedWith.userId': 1 }).catch(() => {});
    await itemsCol.createIndex({ 'sharedWith.email': 1 }).catch(() => {});
    await itemsCol.createIndex({ 'shareConfig.publicId': 1 }).catch(() => {});

    const chunksCol = db.collection(CHUNKS_COLLECTION);
    await chunksCol.createIndex({ uploadId: 1, chunkIndex: 1 }, { unique: true }).catch(() => {});

    const sessionsCol = db.collection(SESSIONS_COLLECTION);
    await sessionsCol.createIndex({ uploadId: 1, userId: 1 }, { unique: true }).catch(() => {});

    const commentsCol = db.collection(COMMENTS_COLLECTION);
    await commentsCol.createIndex({ itemId: 1, createdAt: 1 });

    const activityCol = db.collection(ACTIVITY_COLLECTION);
    await activityCol.createIndex({ itemId: 1, timestamp: -1 });
    await activityCol.createIndex({ userId: 1, timestamp: -1 });
  } catch (err) {
    console.warn('[ServerDrive] Index creation warning:', err);
  }
}

/**
 * Record an audit activity event
 */
export async function recordDriveActivity(
  userId: string,
  itemId: string,
  itemName: string,
  itemType: 'file' | 'folder',
  action: DriveActivityAction,
  details?: string
): Promise<void> {
  try {
    await ensureIndexes();
    const user = await findUserById(userId);
    const db = await getMongoDb();
    const col = db.collection<DriveActivity>(ACTIVITY_COLLECTION);

    const activity: DriveActivity = {
      id: generateId('act'),
      itemId,
      itemName,
      itemType,
      userId,
      userName: user?.name || 'Collaborator',
      userEmail: user?.email || '',
      action,
      details,
      timestamp: Date.now(),
    };

    await col.insertOne(activity as any);
  } catch (err) {
    console.warn('[ServerDrive] Failed to record activity:', err);
  }
}

/**
 * Get items for a user by section, parentId, category, or search query
 */
export async function getCloudItems(
  userId: string,
  options: {
    section?: 'my-drive' | 'starred' | 'recent' | 'trash' | 'shared' | 'category' | 'vault';
    parentId?: string | null;
    category?: DriveCategory;
    query?: string;
    userEmail?: string;
  }
): Promise<DriveItem[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const { section = 'my-drive', parentId = null, category, query, userEmail } = options;

  if (query && query.trim()) {
    // Leverage Hybrid Semantic & Fuzzy Search Engine
    const searchRes = await searchCloudItems(
      userId,
      {
        query: query.trim(),
        section,
        category,
        parentId,
      },
      userEmail
    );
    return searchRes.items;
  }

  let filter: any = {};

  if (section === 'shared') {
    // Items shared with this user (either by userId or email)
    const emailMatch = userEmail?.toLowerCase() || '';
    filter = {
      userId: { $ne: userId },
      isTrash: false,
      $or: [
        { 'sharedWith.userId': userId },
        ...(emailMatch ? [{ 'sharedWith.email': emailMatch }] : []),
      ],
    };
  } else {
    filter.userId = userId;

    if (section === 'trash') {
      filter.isTrash = true;
    } else if (section === 'vault') {
      filter.isTrash = false;
      filter.isVault = true;
    } else if (section === 'starred') {
      filter.isTrash = false;
      filter.isStarred = true;
    } else if (section === 'recent') {
      filter.isTrash = false;
      filter.type = 'file';
    } else if (section === 'category' && category) {
      filter.isTrash = false;
      filter.category = category;
    } else {
      // Standard folder navigation
      filter.isTrash = false;
      filter.parentId = parentId;
    }
  }

  let cursor = col.find(filter);

  if (section === 'recent') {
    cursor = cursor.sort({ updatedAt: -1 }).limit(50);
  } else {
    cursor = cursor.sort({ type: -1, name: 1 });
  }

  const docs = await cursor.toArray();
  return docs.map(({ _id, ...item }: any) => {
    if (section === 'shared') {
      const coll = (item.sharedWith || []).find(
        (c: Collaborator) => c.userId === userId || (userEmail && c.email?.toLowerCase() === userEmail.toLowerCase())
      );
      return {
        ...item,
        isSharedWithMe: true,
        myRole: coll?.role || 'viewer',
      } as DriveItem;
    }
    return item as DriveItem;
  });
}

/**
 * Get single Drive item with permissions verification
 */
export async function getCloudItem(
  userId: string, 
  id: string,
  userEmail?: string
): Promise<DriveItem | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  
  const doc = await col.findOne({ $or: [{ id }, { 'shareConfig.publicId': id }] });
  if (!doc) return null;
  const { _id, ...item }: any = doc;

  if (item.userId === userId) {
    return item as DriveItem;
  }

  const coll = (item.sharedWith || []).find(
    (c: Collaborator) => c.userId === userId || (userEmail && c.email?.toLowerCase() === userEmail.toLowerCase())
  );
  if (coll) {
    return {
      ...item,
      isSharedWithMe: true,
      myRole: coll.role,
    } as DriveItem;
  }

  if (item.shareConfig?.isPublic) {
    return {
      ...item,
      isSharedWithMe: true,
      myRole: 'viewer',
    } as DriveItem;
  }

  return null;
}

/**
 * Public recipient retrieval of a shared item with password & expiration verification
 */
export async function getPublicSharedItem(
  shareIdOrItemId: string,
  password?: string
): Promise<{
  item?: DriveItem;
  passwordRequired?: boolean;
  expired?: boolean;
  error?: string;
}> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const doc = await col.findOne({
    $or: [{ id: shareIdOrItemId }, { 'shareConfig.publicId': shareIdOrItemId }],
  });

  if (!doc) {
    return { error: 'File or folder not found.' };
  }

  const { _id, ...item }: any = doc;
  const shareConfig = item.shareConfig as ShareConfig | undefined;

  if (!shareConfig?.isPublic) {
    return { error: 'This item is not publicly shared or sharing has been disabled.' };
  }

  // Check expiration
  if (shareConfig.expiresAt && Date.now() > shareConfig.expiresAt) {
    return { expired: true, error: 'This share link has expired.' };
  }

  // Check password protection
  if (shareConfig.hasPassword) {
    if (!password) {
      return { passwordRequired: true };
    }
    if (shareConfig.passwordHash && password !== shareConfig.passwordHash) {
      return { passwordRequired: true, error: 'Incorrect password.' };
    }
  }

  // Increment view count
  await col.updateOne(
    { id: item.id },
    { $inc: { 'shareConfig.viewCount': 1 } }
  );

  return { item: item as DriveItem };
}

/**
 * Create a new folder
 */
export async function createCloudFolder(
  userId: string,
  name: string,
  parentId: string | null = null,
  color: DriveFolderColor = 'default'
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const user = await findUserById(userId);

  const folder: DriveItem = {
    id: generateId('fld'),
    name: name.trim() || 'Untitled Folder',
    parentId,
    type: 'folder',
    mimeType: 'application/x-directory',
    size: 0,
    extension: '',
    category: 'other',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: false,
    isTrash: false,
    color,
    itemCount: 0,
    userId,
    ownerEmail: user?.email || '',
    ownerName: user?.name || '',
    sharedWith: [],
  };

  await col.insertOne({ ...folder } as any);
  await recordDriveActivity(userId, folder.id, folder.name, 'folder', 'created_folder');
  return folder;
}

/**
 * Batch create directory tree paths (e.g. ['src', 'src/assets', 'docs/2026'])
 */
export async function createBatchFolders(
  userId: string,
  folderPaths: string[],
  baseParentId: string | null = null
): Promise<Record<string, string>> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const user = await findUserById(userId);

  const folderMap: Record<string, string> = {};
  const sortedPaths = [...new Set(folderPaths)].sort((a, b) => a.split('/').length - b.split('/').length);

  for (const path of sortedPaths) {
    const segments = path.replace(/^\/+|\/+$/g, '').split('/');
    let currentParent = baseParentId;
    let accumulatedPath = '';

    for (const segment of segments) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

      if (folderMap[accumulatedPath]) {
        currentParent = folderMap[accumulatedPath];
        continue;
      }

      const existing = await col.findOne({
        userId,
        parentId: currentParent,
        name: segment,
        type: 'folder',
        isTrash: false,
      });

      if (existing) {
        folderMap[accumulatedPath] = existing.id;
        currentParent = existing.id;
      } else {
        const newFolder: DriveItem = {
          id: generateId('fld'),
          name: segment,
          parentId: currentParent,
          type: 'folder',
          mimeType: 'application/x-directory',
          size: 0,
          extension: '',
          category: 'other',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastAccessedAt: Date.now(),
          isStarred: false,
          isTrash: false,
          color: 'default',
          itemCount: 0,
          userId,
          ownerEmail: user?.email || '',
          ownerName: user?.name || '',
          sharedWith: [],
        };

        await col.insertOne({ ...newFolder } as any);
        folderMap[accumulatedPath] = newFolder.id;
        currentParent = newFolder.id;
      }
    }
  }

  return folderMap;
}

/**
 * Upload single small file (< 4MB) to Cloud Storage
 */
export async function uploadCloudFile(
  userId: string,
  name: string,
  mimeType: string,
  buffer: Buffer,
  parentId: string | null = null
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const bucket = await getStorageBucket();
  const user = await findUserById(userId);

  const id = generateId('fl');
  const ext = name.split('.').pop()?.toLowerCase() || '';

  let finalBuffer = buffer;
  let finalMime = mimeType || 'application/octet-stream';

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    try {
      const optimized = await sharp(buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer();
      if (optimized.length < buffer.length) {
        finalBuffer = optimized;
        finalMime = 'image/jpeg';
      }
    } catch {}
  }

  const category = categorizeFile(name, finalMime);

  const readable = new Readable();
  readable.push(finalBuffer);
  readable.push(null);

  const uploadStream = bucket.openUploadStream(id, {
    metadata: {
      userId,
      originalName: name,
      mimeType: finalMime,
      size: finalBuffer.length,
      originalSize: buffer.length,
      createdAt: Date.now(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    readable.pipe(uploadStream)
      .on('finish', () => resolve())
      .on('error', (err) => reject(err));
  });

  const initialLabels = getHeuristicLabels({
    fileName: name,
    relativePath: name,
    category,
    mimeType: finalMime,
    size: finalBuffer.length,
  });

  const item: DriveItem = {
    id,
    name,
    parentId,
    type: 'file',
    mimeType: finalMime,
    size: finalBuffer.length,
    extension: ext,
    category,
    tags: initialLabels.tags,
    aiSummary: initialLabels.aiSummary,
    aiCategory: initialLabels.aiCategory,
    semanticKeywords: initialLabels.semanticKeywords,
    isAutoLabeled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: false,
    isTrash: false,
    userId,
    ownerEmail: user?.email || '',
    ownerName: user?.name || '',
    sharedWith: [],
  };

  await col.insertOne({ ...item } as any);
  await recordDriveActivity(userId, id, name, 'file', 'uploaded');

  // Trigger async deep Gemini enrichment in background
  autoLabelFile({
    fileName: name,
    relativePath: name,
    category,
    mimeType,
    size: buffer.length,
  }).then(async (aiLabels) => {
    if (aiLabels.confidence >= 0.8) {
      await col.updateOne(
        { id },
        {
          $set: {
            tags: aiLabels.tags,
            aiSummary: aiLabels.aiSummary,
            aiCategory: aiLabels.aiCategory,
            semanticKeywords: aiLabels.semanticKeywords,
            updatedAt: Date.now(),
          },
        }
      );
    }
  }).catch(() => {});

  return item;
}

// ==========================================
// RESUMABLE 2GB+ CHUNKED UPLOAD ENGINE
// ==========================================

export interface ChunkSessionRecord {
  uploadId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  parentId: string | null;
  relativePath?: string;
  uploadedChunks: number[];
  status: 'active' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export async function initChunkUploadSession(
  userId: string,
  params: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
    chunkSize: number;
    parentId?: string | null;
    relativePath?: string;
  }
): Promise<{ uploadId: string; totalChunks: number; chunkSize: number }> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<ChunkSessionRecord>(SESSIONS_COLLECTION);

  const uploadId = generateId('up');
  const session: ChunkSessionRecord = {
    uploadId,
    userId,
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType || 'application/octet-stream',
    totalChunks: params.totalChunks,
    chunkSize: params.chunkSize,
    parentId: params.parentId || null,
    relativePath: params.relativePath,
    uploadedChunks: [],
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await col.insertOne(session as any);
  return { uploadId, totalChunks: params.totalChunks, chunkSize: params.chunkSize };
}

export async function saveUploadChunk(
  userId: string,
  uploadId: string,
  chunkIndex: number,
  chunkBuffer: Buffer
): Promise<{ success: boolean; chunkIndex: number; totalUploaded: number }> {
  await ensureIndexes();
  const db = await getMongoDb();
  const sessionsCol = db.collection<ChunkSessionRecord>(SESSIONS_COLLECTION);
  const chunksCol = db.collection(CHUNKS_COLLECTION);

  const session = await sessionsCol.findOne({ uploadId, userId });
  if (!session) {
    throw new Error('Upload session not found or unauthorized.');
  }

  await chunksCol.updateOne(
    { uploadId, chunkIndex },
    {
      $set: {
        uploadId,
        chunkIndex,
        userId,
        size: chunkBuffer.length,
        data: chunkBuffer,
        receivedAt: Date.now(),
      },
    },
    { upsert: true }
  );

  await sessionsCol.updateOne(
    { uploadId },
    {
      $addToSet: { uploadedChunks: chunkIndex },
      $set: { updatedAt: Date.now() },
    }
  );

  const updated = await sessionsCol.findOne({ uploadId });
  return {
    success: true,
    chunkIndex,
    totalUploaded: updated?.uploadedChunks.length || 0,
  };
}

export async function getUploadChunkStatus(
  userId: string,
  uploadId: string
): Promise<{ uploadedChunks: number[]; totalChunks: number; status: string }> {
  await ensureIndexes();
  const db = await getMongoDb();
  const sessionsCol = db.collection<ChunkSessionRecord>(SESSIONS_COLLECTION);

  const session = await sessionsCol.findOne({ uploadId, userId });
  if (!session) {
    throw new Error('Upload session not found.');
  }

  return {
    uploadedChunks: session.uploadedChunks || [],
    totalChunks: session.totalChunks,
    status: session.status,
  };
}

export async function completeChunkUploadSession(
  userId: string,
  uploadId: string
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const sessionsCol = db.collection<ChunkSessionRecord>(SESSIONS_COLLECTION);
  const chunksCol = db.collection(CHUNKS_COLLECTION);
  const itemsCol = db.collection<DriveItem>(ITEMS_COLLECTION);
  const bucket = await getStorageBucket();
  const user = await findUserById(userId);

  const session = await sessionsCol.findOne({ uploadId, userId });
  if (!session) {
    throw new Error('Upload session not found.');
  }

  if (session.uploadedChunks.length < session.totalChunks) {
    throw new Error(
      `Incomplete upload: received ${session.uploadedChunks.length} of ${session.totalChunks} chunks.`
    );
  }

  const id = generateId('fl');
  const ext = session.fileName.split('.').pop()?.toLowerCase() || '';
  const category = categorizeFile(session.fileName, session.mimeType);

  const uploadStream = bucket.openUploadStream(id, {
    metadata: {
      userId,
      originalName: session.fileName,
      mimeType: session.mimeType,
      size: session.fileSize,
      createdAt: Date.now(),
    },
  });

  let writtenBytes = 0;
  for (let i = 0; i < session.totalChunks; i++) {
    const chunkDoc = await chunksCol.findOne({ uploadId, chunkIndex: i });
    if (!chunkDoc || !chunkDoc.data) {
      throw new Error(`Missing chunk #${i} during assembly.`);
    }

    const chunkBuffer: Buffer = chunkDoc.data.buffer
      ? Buffer.from(chunkDoc.data.buffer)
      : Buffer.from(chunkDoc.data);

    uploadStream.write(chunkBuffer);
    writtenBytes += chunkBuffer.length;
  }

  uploadStream.end();

  await new Promise<void>((resolve, reject) => {
    uploadStream.on('finish', () => resolve());
    uploadStream.on('error', (err) => reject(err));
  });

  await chunksCol.deleteMany({ uploadId });
  await sessionsCol.updateOne({ uploadId }, { $set: { status: 'completed', updatedAt: Date.now() } });

  const initialLabels = getHeuristicLabels({
    fileName: session.fileName,
    relativePath: session.relativePath || session.fileName,
    category,
    mimeType: session.mimeType,
    size: writtenBytes,
  });

  const item: DriveItem = {
    id,
    name: session.fileName,
    parentId: session.parentId,
    relativePath: session.relativePath,
    type: 'file',
    mimeType: session.mimeType,
    size: writtenBytes,
    extension: ext,
    category,
    tags: initialLabels.tags,
    aiSummary: initialLabels.aiSummary,
    aiCategory: initialLabels.aiCategory,
    semanticKeywords: initialLabels.semanticKeywords,
    isAutoLabeled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: false,
    isTrash: false,
    userId,
    ownerEmail: user?.email || '',
    ownerName: user?.name || '',
    sharedWith: [],
  };

  await itemsCol.insertOne({ ...item } as any);
  await recordDriveActivity(userId, id, session.fileName, 'file', 'uploaded', `Uploaded ${writtenBytes} bytes via chunked engine`);

  // Trigger async deep Gemini enrichment in background
  autoLabelFile({
    fileName: session.fileName,
    relativePath: session.relativePath || session.fileName,
    category,
    mimeType: session.mimeType,
    size: writtenBytes,
  }).then(async (aiLabels) => {
    if (aiLabels.confidence >= 0.8) {
      await itemsCol.updateOne(
        { id },
        {
          $set: {
            tags: aiLabels.tags,
            aiSummary: aiLabels.aiSummary,
            aiCategory: aiLabels.aiCategory,
            semanticKeywords: aiLabels.semanticKeywords,
            updatedAt: Date.now(),
          },
        }
      );
    }
  }).catch(() => {});

  return item;
}

// ==========================================
// HIGH SPEED RANGE STREAMING & CACHING
// ==========================================

export async function getCloudFileStreamWithRange(
  userId: string,
  id: string,
  rangeHeader?: string | null,
  userEmail?: string
): Promise<{
  stream: NodeJS.ReadableStream;
  item: DriveItem;
  range?: { start: number; end: number; total: number; isPartial: boolean };
} | null> {
  let item = await getCloudItem(userId, id, userEmail);
  if (!item) {
    const db = await getMongoDb();
    const doc = await db.collection<DriveItem>(ITEMS_COLLECTION).findOne({ id });
    if (doc && !doc.isVault) {
      item = doc;
    }
  }
  if (!item || item.type === 'folder') return null;

  const bucket = await getStorageBucket();
  const totalSize = item.size;

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (isNaN(start) || start >= totalSize || end >= totalSize || start > end) {
      const stream = bucket.openDownloadStreamByName(id);
      return { stream, item, range: { start: 0, end: totalSize - 1, total: totalSize, isPartial: false } };
    }

    const downloadStream = bucket.openDownloadStreamByName(id, {
      start,
      end: end + 1,
    });

    return {
      stream: downloadStream,
      item,
      range: { start, end, total: totalSize, isPartial: true },
    };
  }

  const downloadStream = bucket.openDownloadStreamByName(id);
  return {
    stream: downloadStream,
    item,
    range: { start: 0, end: totalSize - 1, total: totalSize, isPartial: false },
  };
}

export async function getCloudFileStream(
  userId: string,
  id: string,
  userEmail?: string
): Promise<{ stream: NodeJS.ReadableStream; item: DriveItem } | null> {
  const res = await getCloudFileStreamWithRange(userId, id, null, userEmail);
  if (!res) return null;
  return { stream: res.stream, item: res.item };
}

// ==========================================
// COLLABORATION & MULTI-ACCOUNT SHARING
// ==========================================

export async function addCollaborator(
  ownerUserId: string,
  itemId: string,
  collaboratorEmail: string,
  role: CollaboratorRole = 'viewer'
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const item = await col.findOne({ id: itemId, userId: ownerUserId });
  if (!item) {
    throw new Error('Item not found or you are not the owner.');
  }

  const normalizedEmail = collaboratorEmail.toLowerCase().trim();
  const targetUser = await findUserByEmail(normalizedEmail);

  const existingIndex = (item.sharedWith || []).findIndex(
    (c) => c.email.toLowerCase() === normalizedEmail
  );

  const collaboratorRecord: Collaborator = {
    userId: targetUser ? targetUser.id : `guest_${Date.now()}`,
    email: normalizedEmail,
    name: targetUser ? targetUser.name : normalizedEmail.split('@')[0],
    role,
    addedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    await col.updateOne(
      { id: itemId, userId: ownerUserId },
      { $set: { [`sharedWith.${existingIndex}`]: collaboratorRecord, updatedAt: Date.now() } }
    );
  } else {
    await col.updateOne(
      { id: itemId, userId: ownerUserId },
      { $push: { sharedWith: collaboratorRecord }, $set: { updatedAt: Date.now() } }
    );
  }

  await recordDriveActivity(
    ownerUserId,
    itemId,
    item.name,
    item.type,
    'shared',
    `Shared with ${normalizedEmail} as ${role}`
  );

  const updated = await col.findOne({ id: itemId });
  const { _id, ...clean }: any = updated;
  return clean as DriveItem;
}

export async function removeCollaborator(
  ownerUserId: string,
  itemId: string,
  targetEmail: string
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const item = await col.findOne({ id: itemId, userId: ownerUserId });
  if (!item) {
    throw new Error('Item not found or unauthorized.');
  }

  await col.updateOne(
    { id: itemId, userId: ownerUserId },
    {
      $pull: { sharedWith: { email: targetEmail.toLowerCase().trim() } },
      $set: { updatedAt: Date.now() },
    }
  );

  await recordDriveActivity(
    ownerUserId,
    itemId,
    item.name,
    item.type,
    'unshared',
    `Removed collaborator access for ${targetEmail}`
  );

  const updated = await col.findOne({ id: itemId });
  const { _id, ...clean }: any = updated;
  return clean as DriveItem;
}

export async function updateShareConfig(
  ownerUserId: string,
  itemId: string,
  config: Partial<ShareConfig>
): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const item = await col.findOne({ id: itemId, userId: ownerUserId });
  if (!item) {
    throw new Error('Item not found or unauthorized.');
  }

  const currentConfig: ShareConfig = item.shareConfig || {
    isPublic: false,
    publicId: generateId('sh'),
    allowDownload: true,
    viewCount: 0,
    downloadCount: 0,
  };

  const newConfig: ShareConfig = {
    ...currentConfig,
    ...config,
  };

  await col.updateOne(
    { id: itemId, userId: ownerUserId },
    { $set: { shareConfig: newConfig, updatedAt: Date.now() } }
  );

  const updated = await col.findOne({ id: itemId });
  const { _id, ...clean }: any = updated;
  return clean as DriveItem;
}

// ==========================================
// COMMENTS & TEAM DISCUSSION
// ==========================================

export async function addDriveComment(
  userId: string,
  itemId: string,
  content: string
): Promise<DriveComment> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveComment>(COMMENTS_COLLECTION);
  const itemsCol = db.collection<DriveItem>(ITEMS_COLLECTION);
  const user = await findUserById(userId);

  const item = await itemsCol.findOne({ id: itemId });
  if (!item) throw new Error('Item not found.');

  const comment: DriveComment = {
    id: generateId('cmt'),
    itemId,
    userId,
    userName: user?.name || 'Collaborator',
    userEmail: user?.email || '',
    content: content.trim(),
    createdAt: Date.now(),
    resolved: false,
  };

  await col.insertOne(comment as any);
  await recordDriveActivity(userId, itemId, item.name, item.type, 'commented', content.substring(0, 50));
  return comment;
}

export async function getDriveComments(itemId: string): Promise<DriveComment[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveComment>(COMMENTS_COLLECTION);
  const docs = await col.find({ itemId }).sort({ createdAt: 1 }).toArray();
  return docs.map(({ _id, ...c }: any) => c as DriveComment);
}

export async function resolveDriveComment(commentId: string, resolved: boolean = true): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveComment>(COMMENTS_COLLECTION);
  await col.updateOne({ id: commentId }, { $set: { resolved, updatedAt: Date.now() } });
}

export async function getDriveActivities(
  itemId?: string,
  userId?: string,
  limit: number = 30
): Promise<DriveActivity[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveActivity>(ACTIVITY_COLLECTION);

  const filter: any = {};
  if (itemId) filter.itemId = itemId;
  if (userId) filter.userId = userId;

  const docs = await col.find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
  return docs.map(({ _id, ...a }: any) => a as DriveActivity);
}

// ==========================================
// ITEM MUTATIONS & STATS
// ==========================================

export async function updateCloudItem(
  userId: string,
  id: string,
  updates: Partial<DriveItem>
): Promise<DriveItem | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const cleanUpdates = {
    ...updates,
    updatedAt: Date.now(),
  };
  delete (cleanUpdates as any).id;
  delete (cleanUpdates as any).userId;

  await col.updateOne({ id, userId }, { $set: cleanUpdates });
  return await getCloudItem(userId, id);
}

export async function moveCloudItems(
  userId: string,
  itemIds: string[],
  targetFolderId: string | null
): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  await col.updateMany(
    { id: { $in: itemIds }, userId },
    { $set: { parentId: targetFolderId, updatedAt: Date.now() } }
  );
}

export async function trashCloudItems(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  await col.updateMany(
    { id: { $in: itemIds }, userId },
    { $set: { isTrash: true, trashedAt: Date.now(), updatedAt: Date.now() } }
  );
}

export async function restoreCloudItems(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  await col.updateMany(
    { id: { $in: itemIds }, userId },
    { $set: { isTrash: false, trashedAt: undefined, updatedAt: Date.now() } }
  );
}

export async function deleteCloudItemsPermanently(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const bucket = await getStorageBucket();

  const allIdsToDelete = new Set<string>(itemIds);

  async function collectChildren(folderIds: string[]) {
    if (folderIds.length === 0) return;
    const children = await col.find({ parentId: { $in: folderIds }, userId }).toArray();
    const nextFolderIds: string[] = [];
    for (const child of children) {
      allIdsToDelete.add(child.id);
      if (child.type === 'folder') {
        nextFolderIds.push(child.id);
      }
    }
    if (nextFolderIds.length > 0) {
      await collectChildren(nextFolderIds);
    }
  }

  await collectChildren(itemIds);

  const idsArray = Array.from(allIdsToDelete);
  await col.deleteMany({ id: { $in: idsArray }, userId });

  for (const id of idsArray) {
    try {
      const files = await bucket.find({ filename: id }).toArray();
      for (const file of files) {
        await bucket.delete(file._id);
      }
    } catch (err) {
      // ignore individual delete misses
    }
  }
}

export async function emptyCloudTrash(userId: string): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const trashDocs = await col.find({ userId, isTrash: true }).toArray();
  const trashIds = trashDocs.map((d) => d.id);
  if (trashIds.length > 0) {
    await deleteCloudItemsPermanently(userId, trashIds);
  }
}

export async function getCloudDriveStats(userId: string, userEmail?: string): Promise<DriveStats> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const items = await col.find({ userId }).toArray();

  const stats: DriveStats = {
    totalBytes: 0,
    totalFiles: 0,
    totalFolders: 0,
    starredCount: 0,
    trashCount: 0,
    sharedWithMeCount: 0,
    categoryBytes: {
      pdf: 0,
      image: 0,
      spreadsheet: 0,
      media: 0,
      document: 0,
      archive: 0,
      code: 0,
      other: 0,
    },
    categoryCount: {
      pdf: 0,
      image: 0,
      spreadsheet: 0,
      media: 0,
      document: 0,
      archive: 0,
      code: 0,
      other: 0,
    },
  };

  for (const item of items) {
    if (item.isTrash) {
      stats.trashCount++;
      continue;
    }

    if (item.isStarred) {
      stats.starredCount++;
    }

    if (item.type === 'folder') {
      stats.totalFolders++;
    } else {
      stats.totalFiles++;
      stats.totalBytes += item.size || 0;
      const cat = (item.category || 'other') as DriveCategory;
      if (stats.categoryBytes[cat] !== undefined) {
        stats.categoryBytes[cat] += item.size || 0;
        stats.categoryCount[cat] += 1;
      }
    }
  }

  const emailMatch = userEmail?.toLowerCase() || '';
  const sharedCount = await col.countDocuments({
    userId: { $ne: userId },
    isTrash: false,
    $or: [
      { 'sharedWith.userId': userId },
      ...(emailMatch ? [{ 'sharedWith.email': emailMatch }] : []),
    ],
  });
  stats.sharedWithMeCount = sharedCount;

  return stats;
}

export async function getCloudBreadcrumbs(userId: string, folderId: string | null): Promise<DriveBreadcrumb[]> {
  const crumbs: DriveBreadcrumb[] = [{ id: null, name: 'Cloud Drive' }];
  if (!folderId) return crumbs;

  let currentId: string | null = folderId;
  const path: DriveBreadcrumb[] = [];

  while (currentId) {
    const folder = await getCloudItem(userId, currentId);
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return [...crumbs, ...path];
}

// ==========================================
// SEMANTIC & FUZZY SEARCH ENGINE INTEGRATION
// ==========================================

export async function searchCloudItems(
  userId: string,
  options: SearchFilterOptions,
  userEmail?: string
): Promise<SearchResult> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const emailMatch = userEmail?.toLowerCase() || '';
  const filter = {
    $or: [
      { userId },
      ...(emailMatch ? [{ ownerEmail: emailMatch }] : []),
      { 'sharedWith.userId': userId },
      ...(emailMatch ? [{ 'sharedWith.email': emailMatch }] : []),
    ],
  };

  const docs = await col.find(filter).toArray();
  const allItems: DriveItem[] = docs.map(({ _id, ...item }: any) => item as DriveItem);

  return searchDriveItems(allItems, options);
}

// ==========================================
// AI AUTO-LABELING & SEMANTIC ENRICHMENT
// ==========================================

export async function autoLabelDriveItem(userId: string, itemId: string): Promise<DriveItem> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const item = await col.findOne({ id: itemId, userId });
  if (!item) throw new Error('Item not found or unauthorized.');

  const labels = await autoLabelFile({
    fileName: item.name,
    relativePath: item.relativePath || item.name,
    category: item.category,
    mimeType: item.mimeType,
    size: item.size,
  });

  await col.updateOne(
    { id: itemId, userId },
    {
      $set: {
        tags: labels.tags,
        aiSummary: labels.aiSummary,
        aiCategory: labels.aiCategory,
        semanticKeywords: labels.semanticKeywords,
        isAutoLabeled: true,
        updatedAt: Date.now(),
      },
    }
  );

  const updated = await col.findOne({ id: itemId });
  const { _id, ...clean }: any = updated;
  return clean as DriveItem;
}

export async function batchAutoLabelDriveItems(
  userId: string,
  itemIds?: string[],
  allUnlabeled = false
): Promise<{ count: number; updated: DriveItem[] }> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  let query: any = { userId, type: 'file' };
  if (itemIds && itemIds.length > 0) {
    query.id = { $in: itemIds };
  } else if (allUnlabeled) {
    query.$or = [{ isAutoLabeled: { $ne: true } }, { tags: { $size: 0 } }, { tags: { $exists: false } }];
  }

  const docs = await col.find(query).toArray();
  const updatedItems: DriveItem[] = [];

  for (const doc of docs) {
    try {
      const labels = await autoLabelFile({
        fileName: doc.name,
        relativePath: doc.relativePath || doc.name,
        category: doc.category,
        mimeType: doc.mimeType,
        size: doc.size,
      });

      await col.updateOne(
        { id: doc.id },
        {
          $set: {
            tags: labels.tags,
            aiSummary: labels.aiSummary,
            aiCategory: labels.aiCategory,
            semanticKeywords: labels.semanticKeywords,
            isAutoLabeled: true,
            updatedAt: Date.now(),
          },
        }
      );

      const refreshed = await col.findOne({ id: doc.id });
      if (refreshed) {
        const { _id, ...clean }: any = refreshed;
        updatedItems.push(clean as DriveItem);
      }
    } catch (err) {
      console.error(`Failed to auto-label ${doc.name}:`, err);
    }
  }

  return { count: updatedItems.length, updated: updatedItems };
}

