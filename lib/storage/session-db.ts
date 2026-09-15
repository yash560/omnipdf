import { StudioSession, SessionVersion } from '@/types/session';

const DB_NAME = 'OmniPDF_Studio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lastModified', 'lastModified', { unique: false });
        store.createIndex('filename', 'filename', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save or update an entire session with its PDF bytes and annotation tree to IndexedDB
 */
export async function saveSessionToDB(session: StudioSession): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clone session to ensure clean storage
      const record = {
        ...session,
        lastModified: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save session to IndexedDB:', err);
  }
}

/**
 * Retrieve all active and draft sessions sorted by last modified descending
 */
export async function getAllSessionsFromDB(): Promise<StudioSession[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []) as StudioSession[];
        results.sort((a, b) => b.lastModified - a.lastModified);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load sessions from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieve a specific session by ID
 */
export async function getSessionFromDB(id: string): Promise<StudioSession | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get session from DB:', err);
    return null;
  }
}

/**
 * Delete a session from IndexedDB
 */
export async function deleteSessionFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete session from DB:', err);
  }
}

/**
 * Clear all sessions from IndexedDB
 */
export async function clearAllSessionsFromDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear sessions:', err);
  }
}

/**
 * Export all workspace metadata and annotation snapshots as a backup file
 */
export async function exportWorkspaceBackup(): Promise<Blob> {
  const sessions = await getAllSessionsFromDB();
  // Strip raw array buffers for portable JSON export
  const exportable = sessions.map((s) => ({
    id: s.id,
    filename: s.filename,
    size: s.size,
    pageCount: s.pageCount,
    annotations: s.annotations,
    currentPage: s.currentPage,
    zoom: s.zoom,
    createdAt: s.createdAt,
    lastModified: s.lastModified,
    versions: s.versions,
  }));

  const json = JSON.stringify(exportable, null, 2);
  return new Blob([json], { type: 'application/json' });
}
