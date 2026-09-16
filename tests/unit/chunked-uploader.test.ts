import assert from 'node:assert';
import { chunkedUploader } from '../../lib/drive/chunked-uploader';
import { ChunkUploadProgress } from '../../lib/drive/drive-types';

export async function runChunkedUploaderTests() {
  console.log('🧪 Testing [chunked-uploader.ts] (Retry & Failure Handling)...');

  // Clear any existing queue
  chunkedUploader.clearAll();
  assert.strictEqual(chunkedUploader.getProgressList().length, 0, 'Queue should be empty initially');

  // Test subscription listener
  let latestProgress: ChunkUploadProgress[] = [];
  const unsubscribe = chunkedUploader.subscribe((list) => {
    latestProgress = list;
  });

  // 1. Simulate adding files to the internal queue and marking one as failed
  const testFile1 = new File(['hello world 1'], 'subfile1.pdf', { type: 'application/pdf' });
  const testFile2 = new File(['hello world 2'], 'subfile2.png', { type: 'image/png' });

  // Access private queue for unit testing simulation
  const orchestrator = chunkedUploader as any;
  const upId1 = 'test_up_1';
  const upId2 = 'test_up_2';

  orchestrator.queue.set(upId1, {
    file: testFile1,
    parentId: 'folder_123',
    relativePath: 'MyFolder/subfile1.pdf',
    progress: {
      uploadId: upId1,
      fileName: 'subfile1.pdf',
      fileSize: 100,
      relativePath: 'MyFolder/subfile1.pdf',
      uploadedBytes: 50,
      totalBytes: 100,
      percentage: 50,
      speedBytesPerSec: 0,
      status: 'error',
      error: 'Network connection dropped during chunk 1',
    },
    aborted: false,
    paused: false,
  });

  orchestrator.queue.set(upId2, {
    file: testFile2,
    parentId: 'folder_123',
    relativePath: 'MyFolder/subfile2.png',
    progress: {
      uploadId: upId2,
      fileName: 'subfile2.png',
      fileSize: 200,
      relativePath: 'MyFolder/subfile2.png',
      uploadedBytes: 200,
      totalBytes: 200,
      percentage: 100,
      speedBytesPerSec: 0,
      status: 'completed',
    },
    aborted: false,
    paused: false,
  });

  orchestrator.notify();

  // Verify initial state
  assert.strictEqual(latestProgress.length, 2, 'Should have 2 items in progress list');
  assert.strictEqual(chunkedUploader.getFailedCount(), 1, 'Should report 1 failed upload');

  const failedItem = latestProgress.find((p) => p.uploadId === upId1);
  assert.ok(failedItem, 'Failed item should exist');
  assert.strictEqual(failedItem?.status, 'error');
  assert.strictEqual(failedItem?.error, 'Network connection dropped during chunk 1');

  // 2. Test clearCompleted() does NOT delete failed items
  chunkedUploader.clearCompleted();
  assert.strictEqual(chunkedUploader.getProgressList().length, 1, 'clearCompleted should keep failed item');
  assert.strictEqual(chunkedUploader.getProgressList()[0].uploadId, upId1, 'Only failed item remains');

  // 3. Test retry(uploadId) resets status to queued, clears error, and resets bytes
  // Mock processFileUpload to prevent actual network fetch in unit test
  let processCalledFor: string[] = [];
  const originalProcess = orchestrator.processFileUpload;
  orchestrator.processFileUpload = async (uploadId: string) => {
    processCalledFor.push(uploadId);
  };

  chunkedUploader.retry(upId1);

  const retriedItem = orchestrator.queue.get(upId1);
  assert.strictEqual(retriedItem.progress.status, 'queued', 'Status should reset to queued');
  assert.strictEqual(retriedItem.progress.error, undefined, 'Error should be cleared');
  assert.strictEqual(retriedItem.progress.uploadedBytes, 0, 'Uploaded bytes should be reset');
  assert.strictEqual(retriedItem.progress.percentage, 0, 'Percentage should be reset');
  assert.ok(processCalledFor.includes(upId1), 'processFileUpload should have been triggered');

  // 4. Test retryAllFailed()
  // Add a 2nd failed file
  const upId3 = 'test_up_3';
  orchestrator.queue.set(upId3, {
    file: new File(['data'], 'subfile3.docx'),
    parentId: 'folder_123',
    relativePath: 'MyFolder/subfile3.docx',
    progress: {
      uploadId: upId3,
      fileName: 'subfile3.docx',
      fileSize: 300,
      relativePath: 'MyFolder/subfile3.docx',
      uploadedBytes: 0,
      totalBytes: 300,
      percentage: 0,
      speedBytesPerSec: 0,
      status: 'error',
      error: '504 Gateway Timeout on chunk init',
    },
    aborted: false,
    paused: false,
  });
  // Mark upId1 as error again to test batch retry
  orchestrator.queue.get(upId1).progress.status = 'error';
  orchestrator.notify();

  assert.strictEqual(chunkedUploader.getFailedCount(), 2, 'Should report 2 failed uploads');

  processCalledFor = [];
  chunkedUploader.retryAllFailed();

  assert.strictEqual(processCalledFor.length, 2, 'Both failed files should be re-processed');
  assert.ok(processCalledFor.includes(upId1));
  assert.ok(processCalledFor.includes(upId3));
  assert.strictEqual(chunkedUploader.getFailedCount(), 0, 'No failed items should remain after retryAllFailed');

  // 5. Test cancel(uploadId)
  chunkedUploader.cancel(upId1);
  assert.strictEqual(orchestrator.queue.has(upId1), false, 'Item should be removed after cancel');

  // Restore original processFileUpload & clean up
  orchestrator.processFileUpload = originalProcess;
  chunkedUploader.clearAll();
  unsubscribe();

  console.log('  ✅ [chunked-uploader.ts] passed all retry & failure handling assertions.');
}
