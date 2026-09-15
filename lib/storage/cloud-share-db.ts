import { EncryptedSharePackage } from '@/types/share';

// In-Memory global storage for serverless runtime cache
const globalShareStore = new Map<string, EncryptedSharePackage>();

/**
 * Save an encrypted package to memory / server store
 */
export async function saveEncryptedPackage(pkg: EncryptedSharePackage): Promise<void> {
  globalShareStore.set(pkg.id, pkg);
}

/**
 * Retrieve an encrypted package by ID, enforcing expiration and burn-after-reading rules
 */
export async function getEncryptedPackage(id: string): Promise<EncryptedSharePackage | null> {
  const pkg = globalShareStore.get(id);
  if (!pkg) return null;

  // Check expiration
  if (pkg.expiresAt && Date.now() > pkg.expiresAt) {
    globalShareStore.delete(id);
    return null;
  }

  // Increment view count
  pkg.viewCount = (pkg.viewCount || 0) + 1;

  // Check burn after read
  if (pkg.permissions.burnAfterRead && pkg.viewCount > 1) {
    globalShareStore.delete(id);
    return null;
  }

  // Check max views
  if (pkg.maxViews && pkg.viewCount > pkg.maxViews) {
    globalShareStore.delete(id);
    return null;
  }

  return pkg;
}

/**
 * Delete / Revoke a shared package
 */
export async function deleteEncryptedPackage(id: string): Promise<boolean> {
  return globalShareStore.delete(id);
}

// ----------------- CLIENT-SIDE INDEXEDDB STORE ----------------- //
const IDB_NAME = 'OmniPDF_CloudShare_Client';
const IDB_STORE = 'shared_packages';
const IDB_VERSION = 1;

function getClientShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only available in browser'));
    }

    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveClientSharedPackage(pkg: EncryptedSharePackage): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await getClientShareDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(pkg);
  } catch (err) {
    console.warn('Failed to save to client IndexedDB share store:', err);
  }
}

export async function getClientSharedPackage(id: string): Promise<EncryptedSharePackage | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await getClientShareDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
