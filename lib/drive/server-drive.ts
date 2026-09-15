import { getMongoDb } from '@/lib/db/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';
import { DriveItem, DriveCategory, DriveFolderColor, DriveStats, DriveBreadcrumb } from './drive-types';
import { categorizeFile } from './drive-helpers';
import { Readable } from 'stream';

const ITEMS_COLLECTION = 'filecraft_drive_items';
const BUCKET_NAME = 'filecraft_drive_storage';

function generateId(): string {
  return 'fc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Get GridFS bucket instance
 */
async function getStorageBucket(): Promise<GridFSBucket> {
  const db = await getMongoDb();
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/**
 * Initialize indexes on filecraft_drive_items
 */
let indexesCreated = false;
async function ensureIndexes() {
  if (indexesCreated) return;
  indexesCreated = true;
  try {
    const db = await getMongoDb();
    const col = db.collection(ITEMS_COLLECTION);
    await col.createIndex({ userId: 1, parentId: 1, isTrash: 1 });
    await col.createIndex({ userId: 1, isStarred: 1, isTrash: 1 });
    await col.createIndex({ userId: 1, updatedAt: -1 });
    await col.createIndex({ userId: 1, category: 1, isTrash: 1 });
    await col.createIndex({ id: 1, userId: 1 }, { unique: true });
  } catch (err) {
    console.warn('[ServerDrive] Index creation warning:', err);
  }
}

/**
 * Get items for a user by section, parentId, category, or search query
 */
export async function getCloudItems(
  userId: string,
  options: {
    section?: 'my-drive' | 'starred' | 'recent' | 'trash' | 'category';
    parentId?: string | null;
    category?: DriveCategory;
    query?: string;
  }
): Promise<DriveItem[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  const { section = 'my-drive', parentId = null, category, query } = options;

  let filter: any = { userId };

  if (query && query.trim()) {
    const q = query.trim();
    filter.isTrash = false;
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { extension: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
      { description: { $regex: q, $options: 'i' } },
    ];
  } else if (section === 'trash') {
    filter.isTrash = true;
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

  let cursor = col.find(filter);

  if (section === 'recent') {
    cursor = cursor.sort({ updatedAt: -1 }).limit(50);
  } else {
    // Folders first, then alphabetically
    cursor = cursor.sort({ type: -1, name: 1 });
  }

  const docs = await cursor.toArray();
  return docs.map(({ _id, ...item }: any) => item as DriveItem);
}

/**
 * Get single Drive item
 */
export async function getCloudItem(userId: string, id: string): Promise<DriveItem | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const doc = await col.findOne({ id, userId });
  if (!doc) return null;
  const { _id, ...item }: any = doc;
  return item as DriveItem;
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

  const folder: DriveItem = {
    id: generateId(),
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
  };

  await col.insertOne({ ...folder, userId } as any);
  return folder;
}

/**
 * Upload a file to Cloud Storage (GridFS + Metadata)
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

  const id = generateId();
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const category = categorizeFile(name, mimeType);

  // 1. Upload binary stream to GridFS
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);

  const uploadStream = bucket.openUploadStream(id, {
    metadata: {
      userId,
      originalName: name,
      mimeType,
      size: buffer.length,
      createdAt: Date.now(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    readable.pipe(uploadStream)
      .on('finish', () => resolve())
      .on('error', (err) => reject(err));
  });

  // 2. Save metadata record
  const item: DriveItem = {
    id,
    name,
    parentId,
    type: 'file',
    mimeType: mimeType || 'application/octet-stream',
    size: buffer.length,
    extension: ext,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: false,
    isTrash: false,
  };

  await col.insertOne({ ...item, userId } as any);
  return item;
}

/**
 * Download / Stream binary file from Cloud GridFS
 */
export async function getCloudFileStream(
  userId: string,
  id: string
): Promise<{ stream: NodeJS.ReadableStream; item: DriveItem } | null> {
  const item = await getCloudItem(userId, id);
  if (!item || item.type === 'folder') return null;

  const bucket = await getStorageBucket();
  const downloadStream = bucket.openDownloadStreamByName(id);

  return { stream: downloadStream, item };
}

/**
 * Update cloud item metadata
 */
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

/**
 * Move items to target folder in Cloud
 */
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

/**
 * Move items to Cloud Trash
 */
export async function trashCloudItems(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  await col.updateMany(
    { id: { $in: itemIds }, userId },
    { $set: { isTrash: true, trashedAt: Date.now(), updatedAt: Date.now() } }
  );
}

/**
 * Restore items from Cloud Trash
 */
export async function restoreCloudItems(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);

  await col.updateMany(
    { id: { $in: itemIds }, userId },
    { $set: { isTrash: false, trashedAt: undefined, updatedAt: Date.now() } }
  );
}

/**
 * Permanently delete items and GridFS blobs from Cloud
 */
export async function deleteCloudItemsPermanently(userId: string, itemIds: string[]): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const col = db.collection<DriveItem>(ITEMS_COLLECTION);
  const bucket = await getStorageBucket();

  // Recursively find all child items if deleting folders
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

  // Delete metadata records
  await col.deleteMany({ id: { $in: idsArray }, userId });

  // Delete GridFS chunks for files
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

/**
 * Empty entire Cloud Trash
 */
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

/**
 * Compute Cloud Storage statistics
 */
export async function getCloudDriveStats(userId: string): Promise<DriveStats> {
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

  return stats;
}

/**
 * Get folder breadcrumbs path
 */
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
