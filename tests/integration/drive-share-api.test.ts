import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleGuestAuth } from '../../app/api/auth/guest/route';
import { POST as handleCreateFolder } from '../../app/api/drive/folder/route';
import { POST as handleShareLink } from '../../app/api/drive/share/link/route';
import { GET as handlePublicShare } from '../../app/api/drive/share/public/route';
import { POST as handleAddCollaborator, DELETE as handleRemoveCollaborator } from '../../app/api/drive/share/collaborator/route';
import { hashPassword } from '../../lib/auth/jwt';

export async function runDriveShareApiTests() {
  console.log('🧪 Testing [Drive Sharing & Collaboration API Endpoints]...');

  // 1. Authenticate Owner
  const guestRes = await handleGuestAuth();
  const guestData = await guestRes.json();
  const token = guestData.token;
  assert.ok(token);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 2. Create Item to Share
  const folderReq = new NextRequest('http://localhost:3000/api/drive/folder', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Project Roadmap & Docs',
      color: 'blue',
    }),
  });
  const folderRes = await handleCreateFolder(folderReq);
  const folderData = await folderRes.json();
  const itemId = folderData.folder.id;

  // 3. Configure Public Share Link (Allow Download)
  const shareReq = new NextRequest('http://localhost:3000/api/drive/share/link', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      itemId,
      isPublic: true,
      allowDownload: true,
    }),
  });
  const shareRes = await handleShareLink(shareReq);
  const shareData = await shareRes.json();
  assert.strictEqual(shareRes.status, 200);
  assert.strictEqual(shareData.success, true);
  assert.strictEqual(shareData.item.shareConfig.isPublic, true);

  // 4. Access Public Shared Item as Anonymous User
  const pubReq = new NextRequest(`http://localhost:3000/api/drive/share/public?id=${itemId}`);
  const pubRes = await handlePublicShare(pubReq);
  const pubData = await pubRes.json();
  assert.strictEqual(pubRes.status, 200);
  assert.strictEqual(pubData.success, true);
  assert.strictEqual(pubData.item.name, 'Project Roadmap & Docs');

  // 5. Add Collaborator
  const collabReq = new NextRequest('http://localhost:3000/api/drive/share/collaborator', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      itemId,
      email: 'teammate@filecraft.test',
      role: 'editor',
    }),
  });
  const collabRes = await handleAddCollaborator(collabReq);
  const collabData = await collabRes.json();
  assert.strictEqual(collabRes.status, 200);
  assert.strictEqual(collabData.success, true);
  assert.ok(collabData.item.sharedWith.some((c: any) => c.email === 'teammate@filecraft.test'));

  // 6. Remove Collaborator
  const removeCollabReq = new NextRequest('http://localhost:3000/api/drive/share/collaborator', {
    method: 'DELETE',
    headers: authHeaders,
    body: JSON.stringify({
      itemId,
      email: 'teammate@filecraft.test',
    }),
  });
  const removeCollabRes = await handleRemoveCollaborator(removeCollabReq);
  const removeCollabData = await removeCollabRes.json();
  assert.strictEqual(removeCollabRes.status, 200);
  assert.ok(!removeCollabData.item.sharedWith.some((c: any) => c.email === 'teammate@filecraft.test'));

  // 7. Password Protection on Public Share
  const { hash: passwordHash } = await hashPassword('SharePassword123');
  const lockShareReq = new NextRequest('http://localhost:3000/api/drive/share/link', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      itemId,
      isPublic: true,
      hasPassword: true,
      passwordHash,
    }),
  });
  await handleShareLink(lockShareReq);

  // Access without password should return passwordRequired: true
  const lockedReq = new NextRequest(`http://localhost:3000/api/drive/share/public?id=${itemId}`);
  const lockedRes = await handlePublicShare(lockedReq);
  const lockedData = await lockedRes.json();
  assert.strictEqual(lockedData.passwordRequired, true);

  console.log('  ✅ [Drive Sharing & Collaboration API Endpoints] passed all assertions.');
}
