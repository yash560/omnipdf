import { DriveItem } from './drive-types';
import { getFileBlob } from './drive-db';

// ==========================================
// 1. TRIPLE-TIER CACHE ARCHITECTURE
// ==========================================

// L1: In-Memory Fast Map Cache
const memoryCache = new Map<string, string>();
const MAX_MEMORY_ENTRIES = 300;

function getCacheKey(item: DriveItem): string {
  return `thumb_${item.id}_${item.updatedAt || item.createdAt}`;
}

// L2: Persistent IndexedDB Cache
const THUMB_DB_NAME = 'FileCraft_Thumbnail_Cache';
const THUMB_DB_VERSION = 1;
const THUMB_STORE_NAME = 'thumbnails';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openThumbnailDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(THUMB_DB_NAME, THUMB_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(THUMB_STORE_NAME)) {
          db.createObjectStore(THUMB_STORE_NAME, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('Failed to open thumbnail IndexedDB cache, falling back to memory only.');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export async function getCachedThumbnail(item: DriveItem): Promise<string | null> {
  const key = getCacheKey(item);

  // 1. Check L1 Memory Cache (Instant 0ms)
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  // 2. Check L2 IndexedDB Persistent Cache
  try {
    const db = await openThumbnailDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(THUMB_STORE_NAME, 'readonly');
      const store = tx.objectStore(THUMB_STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const res = req.result;
        if (res && res.dataUrl) {
          // Promote to L1 Memory
          setMemoryCache(key, res.dataUrl);
          resolve(res.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function storeCachedThumbnail(item: DriveItem, dataUrl: string): Promise<void> {
  const key = getCacheKey(item);
  setMemoryCache(key, dataUrl);

  try {
    const db = await openThumbnailDB();
    if (!db) return;

    const tx = db.transaction(THUMB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(THUMB_STORE_NAME);
    store.put({ key, dataUrl, savedAt: Date.now() });
  } catch {
    // Silent fail for non-critical cache write
  }
}

function setMemoryCache(key: string, dataUrl: string) {
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    // Evict oldest entry
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, dataUrl);
}

// ==========================================
// 2. CONCURRENCY-CONTROLLED QUEUE (MAX 2 JOBS)
// ==========================================

interface QueueTask {
  item: DriveItem;
  resolve: (url: string | null) => void;
  reject: (err: any) => void;
  isCancelled: boolean;
}

const MAX_CONCURRENT_RENDERS = 2;
let activeRenders = 0;
const renderQueue: QueueTask[] = [];

function processNextTask() {
  if (activeRenders >= MAX_CONCURRENT_RENDERS || renderQueue.length === 0) {
    return;
  }

  const task = renderQueue.shift();
  if (!task) return;

  if (task.isCancelled) {
    task.resolve(null);
    processNextTask();
    return;
  }

  activeRenders++;

  executeThumbnailRender(task.item)
    .then((url) => {
      if (!task.isCancelled) {
        task.resolve(url);
      } else {
        task.resolve(null);
      }
    })
    .catch((err) => {
      if (!task.isCancelled) {
        task.reject(err);
      } else {
        task.resolve(null);
      }
    })
    .finally(() => {
      activeRenders--;
      processNextTask();
    });
}

// ==========================================
// 3. THUMBNAIL RENDER ENGINES
// ==========================================

async function executeThumbnailRender(item: DriveItem): Promise<string | null> {
  // Check cache once more
  const cached = await getCachedThumbnail(item);
  if (cached) return cached;

  if (item.category === 'media' && (item.mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(item.extension))) {
    return renderVideoThumbnail(item);
  }

  if (item.category === 'image') {
    return resolveImageThumbnail(item);
  }

  return null;
}

/**
 * Capture video first frame snapshot
 */
async function renderVideoThumbnail(item: DriveItem): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  return new Promise(async (resolve) => {
    let videoUrl = `/api/drive/file/${item.id}`;
    let objectUrlToRevoke: string | null = null;

    try {
      // If local/offline, fetch blob
      const blob = await getFileBlob(item.id);
      if (blob) {
        objectUrlToRevoke = URL.createObjectURL(blob);
        videoUrl = objectUrlToRevoke;
      }

      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5;

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);

      const cleanup = () => {
        clearTimeout(timer);
        video.onloadeddata = null;
        video.onerror = null;
        video.src = '';
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      };

      video.onloadeddata = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetWidth = 320;
          const scale = Math.min(1.0, targetWidth / (video.videoWidth || targetWidth));
          canvas.width = (video.videoWidth || targetWidth) * scale;
          canvas.height = (video.videoHeight || 180) * scale;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            if (dataUrl) {
              storeCachedThumbnail(item, dataUrl);
              cleanup();
              resolve(dataUrl);
              return;
            }
          }
        } catch {}
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Resolve optimized image thumbnail URL
 */
async function resolveImageThumbnail(item: DriveItem): Promise<string | null> {
  // If local offline IndexedDB blob exists, create and cache dataUrl
  const localBlob = await getFileBlob(item.id);
  if (localBlob) {
    try {
      const bitmap = await createImageBitmap(localBlob);
      const canvas = document.createElement('canvas');
      const targetW = 320;
      const scale = Math.min(1.0, targetW / bitmap.width);
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        bitmap.close();
        if (dataUrl) {
          await storeCachedThumbnail(item, dataUrl);
          return dataUrl;
        }
      }
      bitmap.close();
    } catch {}
  }

  // Use server resized thumbnail endpoint
  let tokenParam = '';
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('omnipdf_token');
    if (token) tokenParam = `&token=${encodeURIComponent(token)}`;
  }
  return `/api/drive/thumbnail/${item.id}?w=320${tokenParam}`;
}

// ==========================================
// 4. PUBLIC API
// ==========================================

export interface ThumbnailRequestHandle {
  promise: Promise<string | null>;
  cancel: () => void;
}

/**
 * Request asynchronous thumbnail generation/retrieval with priority queue
 */
export function requestAsyncThumbnail(item: DriveItem): ThumbnailRequestHandle {
  const cacheKey = getCacheKey(item);

  // L1 instant synchronous return
  if (memoryCache.has(cacheKey)) {
    return {
      promise: Promise.resolve(memoryCache.get(cacheKey) || null),
      cancel: () => {},
    };
  }

  let taskRef: QueueTask | null = null;

  const promise = new Promise<string | null>((resolve, reject) => {
    // Check L2 first
    getCachedThumbnail(item).then((cached) => {
      if (cached) {
        resolve(cached);
        return;
      }

      // Fast path: PDFs and images are both server-rendered/resized on demand
      // (see /api/drive/thumbnail/[id]) — no heavy client-side work needed.
      if (item.category === 'image' || item.category === 'pdf') {
        let tokenParam = '';
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('omnipdf_token');
          if (token) tokenParam = `&token=${encodeURIComponent(token)}`;
        }
        const url = `/api/drive/thumbnail/${item.id}?w=320${tokenParam}`;
        setMemoryCache(cacheKey, url);
        resolve(url);
        return;
      }

      // Non-thumbnail categories: resolve null immediately
      if (item.category !== 'media') {
        resolve(null);
        return;
      }

      // Enqueue heavy video frame-capture rendering
      taskRef = {
        item,
        resolve,
        reject,
        isCancelled: false,
      };

      renderQueue.push(taskRef);
      processNextTask();
    });
  });

  return {
    promise,
    cancel: () => {
      if (taskRef) {
        taskRef.isCancelled = true;
        // Remove from pending queue if not yet started
        const idx = renderQueue.indexOf(taskRef);
        if (idx !== -1) {
          renderQueue.splice(idx, 1);
        }
      }
    },
  };
}
