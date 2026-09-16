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
    const { itemIds, isVault } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const col = db.collection('filecraft_drive_items');

    const result = await col.updateMany(
      { id: { $in: itemIds }, userId: auth.userId },
      { $set: { isVault: Boolean(isVault), updatedAt: Date.now() } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      isVault: Boolean(isVault),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update vault items' }, { status: 500 });
  }
}
