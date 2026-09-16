import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { DriveItem } from '@/lib/drive/drive-types';
import { detectDocumentExpiry } from '@/lib/drive/expiry-tracker';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getMongoDb();
    const items = await db
      .collection<DriveItem>('filecraft_drive_items')
      .find({ userId: auth.userId, isTrash: false, type: 'file' })
      .toArray();

    const analyzedItems: DriveItem[] = items.map((it) => {
      const exp = detectDocumentExpiry(it);
      return {
        ...it,
        expiryDate: exp.expiryDate,
        expiryStatus: exp.expiryStatus,
        expiryDaysLeft: exp.expiryDaysLeft,
        expiryType: exp.expiryType,
        expiryDetails: exp.expiryDetails,
      };
    }).filter((it) => it.expiryStatus && it.expiryStatus !== 'none');

    analyzedItems.sort((a, b) => {
      const expA = a.expiryDate || Infinity;
      const expB = b.expiryDate || Infinity;
      return expA - expB;
    });

    const summary = {
      expired: analyzedItems.filter((i) => i.expiryStatus === 'expired').length,
      expiringSoon: analyzedItems.filter((i) => i.expiryStatus === 'expiring_soon').length,
      valid: analyzedItems.filter((i) => i.expiryStatus === 'valid').length,
      total: analyzedItems.length,
    };

    return NextResponse.json({
      items: analyzedItems,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch expiry data' }, { status: 500 });
  }
}
