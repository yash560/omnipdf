import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { searchCloudItems } from '@/lib/drive/server-drive';
import { SearchFilterOptions, DriveCategory, DriveViewSection } from '@/lib/drive/drive-types';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || undefined;
    const category = (searchParams.get('category') as DriveCategory) || undefined;
    const aiCategory = searchParams.get('aiCategory') || undefined;
    const dateRange = (searchParams.get('dateRange') as any) || 'all';
    const section = (searchParams.get('section') as DriveViewSection) || undefined;
    const parentId = searchParams.has('parentId') ? searchParams.get('parentId') : undefined;
    const sort = (searchParams.get('sort') as any) || (query ? 'relevance' : 'date');
    const typeFilter = searchParams.get('type') || undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const isVaultUnlocked = searchParams.get('isVaultUnlocked') === 'true';

    const options: SearchFilterOptions = {
      query,
      tag,
      category,
      aiCategory,
      dateRange,
      section,
      parentId: parentId === 'null' ? null : parentId,
      sort,
      typeFilter,
      limit,
      isVaultUnlocked,
    };

    const results = await searchCloudItems(auth.userId, options, auth.email);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err: any) {
    console.error('[API /api/drive/search] Error:', err);
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 });
  }
}
