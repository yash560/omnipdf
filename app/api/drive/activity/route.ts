import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getDriveActivities } from '@/lib/drive/server-drive';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = req.nextUrl.searchParams.get('itemId') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);

    const activities = await getDriveActivities(itemId, itemId ? undefined : auth.userId, limit);
    return NextResponse.json({ success: true, activities });
  } catch (err: any) {
    console.error('[API /api/drive/activity GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch activity log' }, { status: 500 });
  }
}
