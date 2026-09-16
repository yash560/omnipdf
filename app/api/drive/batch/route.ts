import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemIds, targetParentId, tags, category } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const col = db.collection('filecraft_drive_items');
    const filter = { id: { $in: itemIds }, userId: auth.userId };

    let update: any = {};

    switch (action) {
      case 'star':
        update = { $set: { isStarred: true, updatedAt: Date.now() } };
        break;
      case 'unstar':
        update = { $set: { isStarred: false, updatedAt: Date.now() } };
        break;
      case 'trash':
        update = { $set: { isTrash: true, trashedAt: Date.now(), updatedAt: Date.now() } };
        break;
      case 'restore':
        update = { $set: { isTrash: false, trashedAt: null, updatedAt: Date.now() } };
        break;
      case 'vault':
        update = { $set: { isVault: true, updatedAt: Date.now() } };
        break;
      case 'unvault':
        update = { $set: { isVault: false, updatedAt: Date.now() } };
        break;
      case 'move':
        update = { $set: { parentId: targetParentId ?? null, updatedAt: Date.now() } };
        break;
      case 'tag':
        if (Array.isArray(tags)) {
          update = { $addToSet: { tags: { $each: tags } }, $set: { updatedAt: Date.now() } };
        }
        break;
      case 'category':
        if (category) {
          update = { $set: { category, updatedAt: Date.now() } };
        }
        break;
      default:
        return NextResponse.json({ error: `Unknown batch action: ${action}` }, { status: 400 });
    }

    const result = await col.updateMany(filter, update);

    return NextResponse.json({
      success: true,
      action,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to execute batch action' }, { status: 500 });
  }
}
