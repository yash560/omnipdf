import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { driveLiveBus } from '@/lib/drive/live-bus';
import { 
  updateCloudItem, 
  moveCloudItems, 
  trashCloudItems, 
  restoreCloudItems, 
  deleteCloudItemsPermanently,
  emptyCloudTrash 
} from '@/lib/drive/server-drive';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // 1. Move multiple items
    if (body.action === 'move') {
      const { itemIds, targetFolderId } = body;
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
      }
      await moveCloudItems(auth.userId, itemIds, targetFolderId || null);
      driveLiveBus.broadcast(auth.userId, 'item_updated', { parentId: targetFolderId, data: { action: 'move', itemIds } });
      return NextResponse.json({ success: true, message: 'Items moved successfully' });
    }

    // 2. Update single item metadata
    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ error: 'id and updates object are required' }, { status: 400 });
    }

    const updated = await updateCloudItem(auth.userId, id, updates);
    driveLiveBus.broadcast(auth.userId, 'item_updated', { itemId: id, data: updates });
    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (err: any) {
    console.error('[API /api/drive/item PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemIds } = body;

    if (action === 'empty-trash') {
      await emptyCloudTrash(auth.userId);
      driveLiveBus.broadcast(auth.userId, 'item_deleted', { data: { action: 'empty-trash' } });
      return NextResponse.json({ success: true, message: 'Trash emptied' });
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
    }

    if (action === 'trash') {
      await trashCloudItems(auth.userId, itemIds);
      driveLiveBus.broadcast(auth.userId, 'item_deleted', { data: { action: 'trash', itemIds } });
      return NextResponse.json({ success: true, message: 'Moved to trash' });
    } else if (action === 'restore') {
      await restoreCloudItems(auth.userId, itemIds);
      driveLiveBus.broadcast(auth.userId, 'item_created', { data: { action: 'restore', itemIds } });
      return NextResponse.json({ success: true, message: 'Restored from trash' });
    } else if (action === 'permanent') {
      await deleteCloudItemsPermanently(auth.userId, itemIds);
      driveLiveBus.broadcast(auth.userId, 'item_deleted', { data: { action: 'permanent', itemIds } });
      return NextResponse.json({ success: true, message: 'Deleted permanently' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/drive/item DELETE] Error:', err);
    return NextResponse.json({ error: err.message || 'Delete operation failed' }, { status: 500 });
  }
}
