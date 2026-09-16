import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleGuestAuth } from '../../app/api/auth/guest/route';
import { GET as handleGetItems } from '../../app/api/drive/items/route';
import { POST as handleCreateFolder } from '../../app/api/drive/folder/route';
import { PATCH as handlePatchItem, DELETE as handleDeleteItem } from '../../app/api/drive/item/route';
import { POST as handleBatchAction } from '../../app/api/drive/batch/route';

export async function runDriveCrudApiTests() {
  console.log('🧪 Testing [Drive CRUD & Batch API Endpoints]...');

  // 1. Unauthorized Protection Checks
  const unauthReq = new NextRequest('http://localhost:3000/api/drive/items');
  const unauthRes = await handleGetItems(unauthReq);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be rejected with 401');

  // 2. Authenticate Guest Session
  const guestRes = await handleGuestAuth();
  const guestData = await guestRes.json();
  const token = guestData.token;
  assert.ok(token);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 3. Create Root Folder
  const folderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'QA Test Folder 2026',
      color: 'emerald',
    }),
  });
  const folderRes = await handleCreateFolder(folderReq);
  const folderData = await folderRes.json();
  assert.strictEqual(folderRes.status, 200);
  assert.strictEqual(folderData.success, true);
  assert.strictEqual(folderData.folder.name, 'QA Test Folder 2026');
  assert.strictEqual(folderData.folder.color, 'emerald');
  const folderId = folderData.folder.id;

  // 4. Create Nested Subfolder
  const subFolderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Subfolder Alpha',
      parentId: folderId,
      color: 'purple',
    }),
  });
  const subFolderRes = await handleCreateFolder(subFolderReq);
  const subFolderData = await subFolderRes.json();
  assert.strictEqual(subFolderRes.status, 200);
  assert.strictEqual(subFolderData.folder.parentId, folderId);
  const subFolderId = subFolderData.folder.id;

  // 5. Query Items in Root
  const getRootReq = new NextRequest('http://localhost:3000/api/drive/items?parentId=null', {
    headers: authHeaders,
  });
  const getRootRes = await handleGetItems(getRootReq);
  const getRootData = await getRootRes.json();
  assert.strictEqual(getRootRes.status, 200);
  assert.ok(getRootData.items.some((it: any) => it.id === folderId));

  // 6. Rename Folder
  const renameReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      id: folderId,
      updates: { name: 'QA Test Folder Renamed' },
    }),
  });
  const renameRes = await handlePatchItem(renameReq);
  const renameData = await renameRes.json();
  assert.strictEqual(renameRes.status, 200);
  assert.strictEqual(renameData.item.name, 'QA Test Folder Renamed');

  // 7. Batch Star and Batch Tag Actions
  const batchStarReq = new NextRequest('http://localhost:3000/api/drive/batch', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'star',
      itemIds: [folderId, subFolderId],
    }),
  });
  const batchStarRes = await handleBatchAction(batchStarReq);
  const batchStarData = await batchStarRes.json();
  assert.strictEqual(batchStarRes.status, 200);
  assert.strictEqual(batchStarData.success, true);

  const batchTagReq = new NextRequest('http://localhost:3000/api/drive/batch', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'tag',
      itemIds: [folderId],
      tags: ['QA-Verified', 'Automation-2026'],
    }),
  });
  const batchTagRes = await handleBatchAction(batchTagReq);
  assert.strictEqual(batchTagRes.status, 200);

  // 8. Move subfolder to root
  const moveReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'move',
      itemIds: [subFolderId],
      targetFolderId: null,
    }),
  });
  const moveRes = await handlePatchItem(moveReq);
  assert.strictEqual(moveRes.status, 200);

  // 9. Trash items
  const trashReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'trash',
      itemIds: [subFolderId],
    }),
  });
  const trashRes = await handleDeleteItem(trashReq);
  assert.strictEqual(trashRes.status, 200);

  // 10. Restore items
  const restoreReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'restore',
      itemIds: [subFolderId],
    }),
  });
  const restoreRes = await handleDeleteItem(restoreReq);
  assert.strictEqual(restoreRes.status, 200);

  // 11. Delete Permanently
  const permDeleteReq = new NextRequest('http://localhost:3000/api/drive/item', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'permanent',
      itemIds: [folderId, subFolderId],
    }),
  });
  const permDeleteRes = await handleDeleteItem(permDeleteReq);
  assert.strictEqual(permDeleteRes.status, 200);

  console.log('  ✅ [Drive CRUD & Batch API Endpoints] passed all assertions.');
}
