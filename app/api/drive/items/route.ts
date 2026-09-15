import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getCloudItems, getCloudBreadcrumbs } from '@/lib/drive/server-drive';
import { DriveCategory } from '@/lib/drive/drive-types';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to access Cloud Drive.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const section = (searchParams.get('section') || 'my-drive') as any;
    const parentId = searchParams.get('parentId') || null;
    const category = (searchParams.get('category') || undefined) as DriveCategory | undefined;
    const query = searchParams.get('q') || undefined;

    const [items, breadcrumbs] = await Promise.all([
      getCloudItems(auth.userId, { section, parentId, category, query }),
      getCloudBreadcrumbs(auth.userId, parentId),
    ]);

    return NextResponse.json({
      success: true,
      items,
      breadcrumbs,
    });
  } catch (err: any) {
    console.error('[API /api/drive/items] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch items' }, { status: 500 });
  }
}
