import { DriveItem, ChunkUploadProgress } from './drive-types';
import { createBatchFoldersApi } from './cloud-api';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB chunks (safely below 4.5MB Vercel serverless limit)
const MAX_CONCURRENT_CHUNKS = 3;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('omnipdf_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export type UploadListener = (progressList: ChunkUploadProgress[]) => void;

class ChunkedUploadOrchestrator {
  private queue: Map<string, {
    file: File;
    parentId: string | null;
    relativePath?: string;
    progress: ChunkUploadProgress;
    aborted: boolean;
    paused: boolean;
  }> = new Map();

  private listeners: Set<UploadListener> = new Set();
  private activeUploadsCount = 0;

  public subscribe(listener: UploadListener) {
    this.listeners.add(listener);
    listener(this.getProgressList());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = this.getProgressList();
    this.listeners.forEach((l) => l(list));
  }

  public getProgressList(): ChunkUploadProgress[] {
    return Array.from(this.queue.values()).map((item) => item.progress);
  }

  public pause(uploadId: string) {
    const item = this.queue.get(uploadId);
    if (item) {
      item.paused = true;
      item.progress.status = 'paused';
      this.notify();
    }
  }

  public resume(uploadId: string, onComplete?: (item: DriveItem) => void) {
    const item = this.queue.get(uploadId);
    if (item && item.paused) {
      item.paused = false;
      item.progress.status = 'uploading';
      this.notify();
      this.processFileUpload(uploadId, onComplete);
    }
  }

  public cancel(uploadId: string) {
    const item = this.queue.get(uploadId);
    if (item) {
      item.aborted = true;
      this.queue.delete(uploadId);
      this.notify();
    }
  }

  public clearCompleted() {
    for (const [id, item] of this.queue.entries()) {
      if (item.progress.status === 'completed' || item.progress.status === 'error') {
        this.queue.delete(id);
      }
    }
    this.notify();
  }

  /**
   * Queue and upload multiple files (supports 2GB+ individual files & nested structures)
   */
  public async uploadFiles(
    files: { file: File; parentId?: string | null; relativePath?: string }[],
    baseParentId: string | null = null,
    onItemCompleted?: (item: DriveItem) => void
  ): Promise<void> {
    // 1. If any files have relativePath (nested folder structure), batch create intermediate folders first!
    const folderPaths = new Set<string>();
    for (const f of files) {
      if (f.relativePath && f.relativePath.includes('/')) {
        const dir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/'));
        if (dir) folderPaths.add(dir);
      }
    }

    let folderMap: Record<string, string> = {};
    if (folderPaths.size > 0) {
      try {
        folderMap = await createBatchFoldersApi(Array.from(folderPaths), baseParentId);
      } catch (err) {
        console.error('Failed to pre-create folders:', err);
      }
    }

    // 2. Queue all files
    for (const item of files) {
      const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      
      let targetParentId = item.parentId || baseParentId || null;
      if (item.relativePath && item.relativePath.includes('/')) {
        const dir = item.relativePath.substring(0, item.relativePath.lastIndexOf('/'));
        if (folderMap[dir]) {
          targetParentId = folderMap[dir];
        }
      }

      const progress: ChunkUploadProgress = {
        uploadId,
        fileName: item.file.name,
        fileSize: item.file.size,
        relativePath: item.relativePath,
        uploadedBytes: 0,
        totalBytes: item.file.size,
        percentage: 0,
        speedBytesPerSec: 0,
        status: 'queued',
      };

      this.queue.set(uploadId, {
        file: item.file,
        parentId: targetParentId,
        relativePath: item.relativePath,
        progress,
        aborted: false,
        paused: false,
      });
    }

    this.notify();

    // 3. Process queue items
    for (const uploadId of this.queue.keys()) {
      this.processFileUpload(uploadId, onItemCompleted);
    }
  }

  private async processFileUpload(
    uploadId: string,
    onComplete?: (item: DriveItem) => void
  ) {
    const queueItem = this.queue.get(uploadId);
    if (!queueItem || queueItem.aborted || queueItem.paused) return;

    const { file, parentId, relativePath, progress } = queueItem;
    progress.status = 'uploading';
    this.notify();

    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

    try {
      // 1. Initialize Chunked Upload Session
      const initRes = await fetch('/api/drive/upload/chunk/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          totalChunks,
          chunkSize: CHUNK_SIZE,
          parentId,
          relativePath,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initialize upload session');
      }

      const { uploadId: serverUploadId } = await initRes.json();

      // 2. Query any already uploaded chunks (for instant resumption)
      let completedChunks = new Set<number>();
      try {
        const statusRes = await fetch(`/api/drive/upload/chunk/status?uploadId=${serverUploadId}`, {
          headers: getAuthHeaders(),
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          completedChunks = new Set<number>(statusData.uploadedChunks || []);
        }
      } catch (err) {
        // ignore status check failure
      }

      // 3. Upload chunks concurrently with chunk throttling
      const startTime = Date.now();
      let lastBytesLogged = 0;
      let lastTimeLogged = startTime;

      const chunkIndicesToUpload: number[] = [];
      for (let i = 0; i < totalChunks; i++) {
        if (!completedChunks.has(i)) {
          chunkIndicesToUpload.push(i);
        }
      }

      let activeIndex = 0;
      const uploadWorker = async (): Promise<void> => {
        while (activeIndex < chunkIndicesToUpload.length) {
          if (queueItem.aborted || queueItem.paused) return;

          const chunkIndex = chunkIndicesToUpload[activeIndex++];
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunkBlob = file.slice(start, end);

          let retries = 3;
          let chunkSuccess = false;

          while (retries > 0 && !chunkSuccess) {
            if (queueItem.aborted || queueItem.paused) return;
            try {
              const formData = new FormData();
              formData.append('uploadId', serverUploadId);
              formData.append('chunkIndex', chunkIndex.toString());
              formData.append('chunk', chunkBlob, file.name);

              const chunkRes = await fetch('/api/drive/upload/chunk', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
              });

              if (!chunkRes.ok) {
                throw new Error(`Chunk ${chunkIndex} failed with status ${chunkRes.status}`);
              }

              chunkSuccess = true;
              completedChunks.add(chunkIndex);

              // Update progress & calculate live throughput
              const now = Date.now();
              const timeDiff = (now - lastTimeLogged) / 1000;
              const uploadedBytes = Math.min(file.size, completedChunks.size * CHUNK_SIZE);
              
              if (timeDiff > 0.5) {
                const bytesDiff = uploadedBytes - lastBytesLogged;
                progress.speedBytesPerSec = Math.max(0, bytesDiff / timeDiff);
                lastBytesLogged = uploadedBytes;
                lastTimeLogged = now;
              }

              progress.uploadedBytes = uploadedBytes;
              progress.percentage = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
              this.notify();
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }
      };

      // Run parallel workers up to MAX_CONCURRENT_CHUNKS
      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT_CHUNKS, chunkIndicesToUpload.length) },
        () => uploadWorker()
      );
      await Promise.all(workers);

      if (queueItem.aborted || queueItem.paused) return;

      // 4. Assemble Chunks on Server into GridFS
      progress.status = 'assembling';
      progress.percentage = 99;
      this.notify();

      const completeRes = await fetch('/api/drive/upload/chunk/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ uploadId: serverUploadId }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to assemble file chunks on server');
      }

      const completeData = await completeRes.json();
      const finalItem = completeData.item as DriveItem;

      progress.status = 'completed';
      progress.percentage = 100;
      progress.uploadedBytes = file.size;
      this.notify();

      if (onComplete) onComplete(finalItem);
    } catch (err: any) {
      if (!queueItem.aborted) {
        progress.status = 'error';
        progress.error = err.message || 'Upload failed';
        this.notify();
      }
    }
  }
}

export const chunkedUploader = new ChunkedUploadOrchestrator();
