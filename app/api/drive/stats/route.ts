import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudDriveStats } from '@/lib/drive/server-drive';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCloudDriveStats(auth.userId);
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error('[API /api/drive/stats] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch storage stats' }, { status: 500 });
  }
}
