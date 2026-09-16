import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleGuestAuth } from '../../app/api/auth/guest/route';
import { GET as handleGetItems } from '../../app/api/drive/items/route';
import { POST as handleCreateFolder } from '../../app/api/drive/folder/route';
import { DELETE as handleDeleteItem } from '../../app/api/drive/item/route';
import { POST as handleBatchAction } from '../../app/api/drive/batch/route';
import { uploadCloudFile } from '../../lib/drive/server-drive';
import { getMongoDb } from '../../lib/db/mongodb';
import { GridFSBucket } from 'mongodb';

export async function runDriveCascadingFolderDeletionTests() {
  console.log('🧪 Testing [Cascading Folder Deletion, Trashing, Restoration & Storage Purge]...');

  // 1. Authenticate Guest Session
  const guestRes = await handleGuestAuth();
  const guestData = await guestRes.json();
  const token = guestData.token;
  const userId = guestData.user.id;
  assert.ok(token);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: 'filecraft_drive_storage' });

  // 2. Create Nested Folder Structure: Root -> Level 1 -> Level 2
  const rootFolderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Cascading Root Folder', color: 'rose' }),
  });
  const rootFolderRes = await handleCreateFolder(rootFolderReq);
  const rootFolder = (await rootFolderRes.json()).folder;
  const rootId = rootFolder.id;

  const l1FolderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Level 1 Subfolder', parentId: rootId, color: 'blue' }),
  });
  const l1Folder = (await (await handleCreateFolder(l1FolderReq)).json()).folder;
  const l1Id = l1Folder.id;

  const l2FolderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Level 2 Subfolder', parentId: l1Id, color: 'amber' }),
  });
  const l2Folder = (await (await handleCreateFolder(l2FolderReq)).json()).folder;
  const l2Id = l2Folder.id;

  // 3. Upload Files at every level
  const fileRoot = await uploadCloudFile(userId, 'root_document.pdf', 'application/pdf', Buffer.from('%PDF-1.4 test root'), rootId);
  const fileL1 = await uploadCloudFile(userId, 'l1_image.png', 'image/png', Buffer.from('fake png binary data'), l1Id);
  const fileL2 = await uploadCloudFile(userId, 'l2_invoice.pdf', 'application/pdf', Buffer.from('%PDF-1.4 test invoice'), l2Id);

  const allItemIds = [rootId, l1Id, l2Id, fileRoot.id, fileL1.id, fileL2.id];

  // Verify all 6 items exist and are not in trash
  const initialDocs = await db.collection('filecraft_drive_items').find({ id: { $in: allItemIds } }).toArray();
  assert.strictEqual(initialDocs.length, 6, 'Expected 6 items created initially');
  assert.ok(initialDocs.every((d: any) => !d.isTrash), 'All items should initially not be in trash');

  // 4. Move Root Folder to Trash
  const trashReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({ action: 'trash', itemIds: [rootId] }),
  });
  const trashRes = await handleDeleteItem(trashReq);
  assert.strictEqual(trashRes.status, 200);

  // Verify that ALL 6 nested items (root, l1, l2, and files) are marked isTrash: true
  const trashedDocs = await db.collection('filecraft_drive_items').find({ id: { $in: allItemIds } }).toArray();
  assert.strictEqual(trashedDocs.length, 6);
  assert.ok(
    trashedDocs.every((d: any) => d.isTrash === true),
    'CRITICAL: All nested subfolders and files must cascade to isTrash: true when root is trashed'
  );

  // Verify that active query for files in category 'pdf' excludes trashed files
  const catReq = new NextRequest('http://localhost:3000/api/drive/items?section=category&category=pdf', {
    headers: authHeaders,
  });
  const catRes = await handleGetItems(catReq);
  const catData = await catRes.json();
  assert.ok(!catData.items.some((i: any) => i.id === fileRoot.id || i.id === fileL2.id), 'Trashed files must not appear in category queries');

  // 5. Restore Root Folder from Trash
  const restoreReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({ action: 'restore', itemIds: [rootId] }),
  });
  const restoreRes = await handleDeleteItem(restoreReq);
  assert.strictEqual(restoreRes.status, 200);

  const restoredDocs = await db.collection('filecraft_drive_items').find({ id: { $in: allItemIds } }).toArray();
  assert.strictEqual(restoredDocs.length, 6);
  assert.ok(
    restoredDocs.every((d: any) => !d.isTrash),
    'CRITICAL: All nested subfolders and files must cascade to isTrash: false when root is restored'
  );

  // 6. Permanently Delete Root Folder
  const deleteReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({ action: 'permanent', itemIds: [rootId] }),
  });
  const deleteRes = await handleDeleteItem(deleteReq);
  assert.strictEqual(deleteRes.status, 200);

  // Verify that ALL 6 items are deleted from filecraft_drive_items
  const remainingDocs = await db.collection('filecraft_drive_items').find({ id: { $in: allItemIds } }).toArray();
  assert.strictEqual(
    remainingDocs.length,
    0,
    'CRITICAL: Permanent folder deletion must delete ALL nested subfolders and files'
  );

  // Verify that GridFS storage files for all uploaded files are deleted
  const remainingGridFiles = await bucket.find({ filename: { $in: [fileRoot.id, fileL1.id, fileL2.id] } }).toArray();
  assert.strictEqual(
    remainingGridFiles.length,
    0,
    'CRITICAL: Permanent folder deletion must purge all binary GridFS storage files'
  );

  // 7. Test Batch Action 'delete_permanent' on nested tree
  const root2Folder = (await (await handleCreateFolder(new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Batch Root', color: 'indigo' }),
  }))).json()).folder;

  const childFolder = (await (await handleCreateFolder(new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Batch Child', parentId: root2Folder.id }),
  }))).json()).folder;

  const childFile = await uploadCloudFile(userId, 'batch_doc.pdf', 'application/pdf', Buffer.from('%PDF batch doc'), childFolder.id);

  // Execute batch permanent delete on Root 2
  const batchDelReq = new NextRequest('http://localhost:3000/api/drive/batch', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'delete_permanent', itemIds: [root2Folder.id] }),
  });
  const batchDelRes = await handleBatchAction(batchDelReq);
  assert.strictEqual(batchDelRes.status, 200);

  const remainingBatchDocs = await db.collection('filecraft_drive_items').find({ id: { $in: [root2Folder.id, childFolder.id, childFile.id] } }).toArray();
  assert.strictEqual(remainingBatchDocs.length, 0, 'Batch delete_permanent must cascade to all children and subfiles');

  const remainingBatchGrid = await bucket.find({ filename: childFile.id }).toArray();
  assert.strictEqual(remainingBatchGrid.length, 0, 'Batch delete_permanent must purge GridFS binary blobs');

  // Clean up any other test items created during this test
  await db.collection('filecraft_drive_items').deleteMany({ userId });
  await db.collection('filecraft_users').deleteOne({ id: userId });

  console.log('  ✅ [Cascading Folder Deletion, Trashing, Restoration & Storage Purge] passed all assertions.');
}
