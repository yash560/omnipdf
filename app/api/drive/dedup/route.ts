import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { DriveItem } from '@/lib/drive/drive-types';
import { findDuplicateClusters } from '@/lib/drive/dedup-engine';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getMongoDb();
    const items = await db
      .collection<DriveItem>('filecraft_drive_items')
      .find({ userId: auth.userId, isTrash: false })
      .toArray();

    const clusters = findDuplicateClusters(items);

    return NextResponse.json({
      clusters,
      totalDuplicates: clusters.reduce((acc, c) => acc + (c.items.length - 1), 0),
      totalWastedBytes: clusters.reduce((acc, c) => acc + c.size * (c.items.length - 1), 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to detect duplicates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deleteItemIds } = body;

    if (!Array.isArray(deleteItemIds) || deleteItemIds.length === 0) {
      return NextResponse.json({ error: 'deleteItemIds array required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const result = await db.collection('filecraft_drive_items').updateMany(
      { id: { $in: deleteItemIds }, userId: auth.userId },
      { $set: { isTrash: true, trashedAt: Date.now(), updatedAt: Date.now() } }
    );

    return NextResponse.json({
      success: true,
      trashedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resolve duplicates' }, { status: 500 });
  }
}
