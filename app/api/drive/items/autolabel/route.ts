import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { batchAutoLabelDriveItems, autoLabelDriveItem } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { itemId, itemIds, allUnlabeled } = body;

    if (itemId) {
      const updated = await autoLabelDriveItem(auth.userId, itemId);
      return NextResponse.json({ success: true, item: updated });
    }

    const result = await batchAutoLabelDriveItems(auth.userId, itemIds, allUnlabeled);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API /api/drive/items/autolabel] Error:', err);
    return NextResponse.json({ error: err.message || 'Auto-labeling failed' }, { status: 500 });
  }
}
