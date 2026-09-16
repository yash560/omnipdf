import { 
  DriveItem, 
  DriveBlobRecord, 
  DriveCategory, 
  DriveFolderColor, 
  DriveStats, 
  DriveBreadcrumb 
} from './drive-types';
import { categorizeFile } from './drive-helpers';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const DB_NAME = 'FileCraft_Drive_DB';
const DB_VERSION = 1;
const ITEMS_STORE = 'drive_items';
const BLOBS_STORE = 'drive_blobs';

function openDriveDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only accessible in browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Metadata Items Store
      if (!db.objectStoreNames.contains(ITEMS_STORE)) {
        const itemStore = db.createObjectStore(ITEMS_STORE, { keyPath: 'id' });
        itemStore.createIndex('parentId', 'parentId', { unique: false });
        itemStore.createIndex('type', 'type', { unique: false });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('isStarred', 'isStarred', { unique: false });
        itemStore.createIndex('isTrash', 'isTrash', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        itemStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Binary Blobs Store
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateId(): string {
  return 'fc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Get all items inside a parent folder or in root (excluding or including trash)
 */
export async function getFolderChildren(
  parentId: string | null = null,
  includeTrash = false
): Promise<DriveItem[]> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const index = store.index('parentId');
    const request = index.getAll(parentId);

    request.onsuccess = () => {
      let items = (request.result as DriveItem[]) || [];
      if (!includeTrash) {
        items = items.filter((i) => !i.isTrash);
      }
      // Folders first, then alphabetically
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get item by ID
 */
export async function getDriveItem(id: string): Promise<DriveItem | null> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get binary Blob for a file
 */
export async function getFileBlob(id: string): Promise<Blob | null> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const rec = request.result as DriveBlobRecord | undefined;
      resolve(rec?.blob || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Create a new folder
 */
export async function createDriveFolder(
  name: string,
  parentId: string | null = null,
  color: DriveFolderColor = 'default'
): Promise<DriveItem> {
  const db = await openDriveDB();
  const folderItem: DriveItem = {
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

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE);
    const request = store.put(folderItem);

    request.onsuccess = () => resolve(folderItem);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Upload single or batch files into current folder
 */
export async function uploadDriveFile(
  file: File | { name: string; blob: Blob; type?: string },
  parentId: string | null = null
): Promise<DriveItem> {
  const db = await openDriveDB();
  const id = generateId();
  const mime = file.type || 'application/octet-stream';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const category = categorizeFile(file.name, mime);

  const item: DriveItem = {
    id,
    name: file.name,
    parentId,
    type: 'file',
    mimeType: mime,
    size: file instanceof File ? file.size : file.blob.size,
    extension: ext,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: false,
    isTrash: false,
  };

  const blobData: DriveBlobRecord = {
    id,
    blob: file instanceof File ? file : file.blob,
    mimeType: mime,
    size: item.size,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([ITEMS_STORE, BLOBS_STORE], 'readwrite');
    const itemStore = tx.objectStore(ITEMS_STORE);
    const blobStore = tx.objectStore(BLOBS_STORE);

    itemStore.put(item);
    blobStore.put(blobData);

    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Recursive upload of directory / folder structure from Drag & Drop or input webkitdirectory
 */
export async function uploadDriveDirectoryStructure(
  files: { path: string; file: File }[],
  rootParentId: string | null = null
): Promise<number> {
  const db = await openDriveDB();
  // Map folder relative paths to newly created folder IDs
  const folderPathMap = new Map<string, string>();
  folderPathMap.set('', rootParentId || '');

  let uploadedCount = 0;

  for (const item of files) {
    const parts = item.path.split('/').filter(Boolean);
    const filename = parts.pop() || item.file.name;

    // Ensure all ancestor folders exist
    let currentParentId = rootParentId;
    let accumulatedPath = '';

    for (const folderName of parts) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;
      if (!folderPathMap.has(accumulatedPath)) {
        const createdFolder = await createDriveFolder(folderName, currentParentId);
        folderPathMap.set(accumulatedPath, createdFolder.id);
        currentParentId = createdFolder.id;
      } else {
        currentParentId = folderPathMap.get(accumulatedPath) || null;
      }
    }

    // Upload the file in its target folder
    await uploadDriveFile(item.file, currentParentId);
    uploadedCount++;
  }

  return uploadedCount;
}

/**
 * Update Drive item metadata (rename, color, tags, description, AI summary)
 */
export async function updateDriveItem(
  id: string,
  updates: Partial<DriveItem>
): Promise<DriveItem | null> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (!getReq.result) {
        resolve(null);
        return;
      }
      const updated: DriveItem = {
        ...getReq.result,
        ...updates,
        updatedAt: Date.now(),
      };
      store.put(updated);
      resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Move items to another target folder (or root)
 */
export async function moveDriveItems(
  itemIds: string[],
  targetFolderId: string | null
): Promise<void> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE);

    let completed = 0;
    for (const id of itemIds) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          // Prevent moving folder into itself
          if (id === targetFolderId) return;
          const updated: DriveItem = {
            ...getReq.result,
            parentId: targetFolderId,
            updatedAt: Date.now(),
          };
          store.put(updated);
        }
        completed++;
        if (completed === itemIds.length) {
          resolve();
        }
      };
    }
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Duplicate a file
 */
export async function duplicateDriveFile(id: string): Promise<DriveItem | null> {
  const original = await getDriveItem(id);
  if (!original || original.type === 'folder') return null;

  const blob = await getFileBlob(id);
  if (!blob) return null;

  const copyName = original.name.replace(/(\.[^.]+)$/, ' (Copy)$1');
  return await uploadDriveFile(
    { name: copyName.includes('(Copy)') ? copyName : `${original.name} (Copy)`, blob, type: original.mimeType },
    original.parentId
  );
}

/**
 * Recursively collect all descendant item IDs in IndexedDB
 */
async function collectAllDescendantDriveIds(itemIds: string[]): Promise<string[]> {
  const allIds = new Set<string>(itemIds);
  let currentFolderIds = [...itemIds];

  while (currentFolderIds.length > 0) {
    const nextFolderIds: string[] = [];
    for (const folderId of currentFolderIds) {
      const it = await getDriveItem(folderId);
      if (it?.type === 'folder' || !it) {
        const children = await getFolderChildren(folderId, true);
        for (const child of children) {
          if (!allIds.has(child.id)) {
            allIds.add(child.id);
            if (child.type === 'folder') {
              nextFolderIds.push(child.id);
            }
          }
        }
      }
    }
    currentFolderIds = nextFolderIds;
  }

  return Array.from(allIds);
}

/**
 * Move items to Trash (recursively moves all nested files and subfolders)
 */
export async function moveDriveItemsToTrash(itemIds: string[]): Promise<void> {
  const allIdsToTrash = await collectAllDescendantDriveIds(itemIds);
  if (allIdsToTrash.length === 0) return;

  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE);

    for (const id of allIdsToTrash) {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          store.put({
            ...req.result,
            isTrash: true,
            trashedAt: Date.now(),
          });
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Restore items from Trash (recursively restores all nested files and subfolders)
 */
export async function restoreDriveItemsFromTrash(itemIds: string[]): Promise<void> {
  const allIdsToRestore = await collectAllDescendantDriveIds(itemIds);
  if (allIdsToRestore.length === 0) return;

  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readwrite');
    const store = tx.objectStore(ITEMS_STORE);

    for (const id of allIdsToRestore) {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          store.put({
            ...req.result,
            isTrash: false,
            trashedAt: undefined,
          });
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Delete items permanently
 */
export async function deleteDriveItemsPermanently(itemIds: string[]): Promise<void> {
  const allIdsToDelete = await collectAllDescendantDriveIds(itemIds);
  if (allIdsToDelete.length === 0) return;

  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ITEMS_STORE, BLOBS_STORE], 'readwrite');
    const itemStore = tx.objectStore(ITEMS_STORE);
    const blobStore = tx.objectStore(BLOBS_STORE);

    for (const id of allIdsToDelete) {
      itemStore.delete(id);
      blobStore.delete(id);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Empty entire Trash
 */
export async function emptyDriveTrash(): Promise<void> {
  const trashItems = await getTrashItems();
  await deleteDriveItemsPermanently(trashItems.map((i) => i.id));
}

/**
 * Get Starred items
 */
export async function getStarredItems(): Promise<DriveItem[]> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const index = store.index('isStarred');
    const req = index.getAll(IDBKeyRange.only(true as any) || true);

    req.onsuccess = () => {
      const items = ((req.result as DriveItem[]) || []).filter((i) => !i.isTrash);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get Recent items (last accessed or modified)
 */
export async function getRecentItems(limit = 40): Promise<DriveItem[]> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const index = store.index('updatedAt');
    const req = index.getAll();

    req.onsuccess = () => {
      const items = ((req.result as DriveItem[]) || [])
        .filter((i) => !i.isTrash && i.type === 'file')
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get Trash items
 */
export async function getTrashItems(): Promise<DriveItem[]> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = ((req.result as DriveItem[]) || []).filter((i) => i.isTrash);
      items.sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0));
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get items by category
 */
export async function getItemsByCategory(category: DriveCategory): Promise<DriveItem[]> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const index = store.index('category');
    const req = index.getAll(category);

    req.onsuccess = () => {
      const items = ((req.result as DriveItem[]) || []).filter((i) => !i.isTrash);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get folder breadcrumb path
 */
export async function getFolderBreadcrumbs(folderId: string | null): Promise<DriveBreadcrumb[]> {
  const crumbs: DriveBreadcrumb[] = [{ id: null, name: 'My Drive' }];
  if (!folderId) return crumbs;

  let currentId: string | null = folderId;
  const path: DriveBreadcrumb[] = [];

  while (currentId) {
    const folder = await getDriveItem(currentId);
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return [...crumbs, ...path];
}

/**
 * Search Drive items with fuzzy query
 */
export async function searchDrive(
  query: string,
  category?: DriveCategory
): Promise<DriveItem[]> {
  const db = await openDriveDB();
  const q = query.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      let items = ((req.result as DriveItem[]) || []).filter((i) => !i.isTrash);
      if (category) {
        items = items.filter((i) => i.category === category);
      }
      if (q) {
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.extension.toLowerCase().includes(q) ||
            i.tags?.some((t) => t.toLowerCase().includes(q)) ||
            i.description?.toLowerCase().includes(q)
        );
      }
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Compute aggregate Drive statistics (Storage, category breakdowns)
 */
export async function getDriveStats(): Promise<DriveStats> {
  const db = await openDriveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, 'readonly');
    const store = tx.objectStore(ITEMS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as DriveItem[]) || [];
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
          stats.totalBytes += item.size;
          stats.categoryBytes[item.category] = (stats.categoryBytes[item.category] || 0) + item.size;
          stats.categoryCount[item.category] = (stats.categoryCount[item.category] || 0) + 1;
        }
      }

      resolve(stats);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Export a single file or an entire folder tree as a downloadable ZIP archive
 */
export async function exportDriveItemAsZip(itemId: string): Promise<void> {
  const root = await getDriveItem(itemId);
  if (!root) return;

  const zip = new JSZip();

  if (root.type === 'file') {
    const blob = await getFileBlob(root.id);
    if (blob) {
      saveAs(blob, root.name);
    }
    return;
  }

  // Recursive folder bundling
  async function addFolderToZip(folderId: string, zipFolder: JSZip) {
    const children = await getFolderChildren(folderId, false);
    for (const child of children) {
      if (child.type === 'folder') {
        const subZip = zipFolder.folder(child.name);
        if (subZip) {
          await addFolderToZip(child.id, subZip);
        }
      } else {
        const blob = await getFileBlob(child.id);
        if (blob) {
          zipFolder.file(child.name, blob);
        }
      }
    }
  }

  const rootZipFolder = zip.folder(root.name) || zip;
  await addFolderToZip(root.id, rootZipFolder);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${root.name}.zip`);
}
