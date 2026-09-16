import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { replaceCloudFileContent } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const itemId = formData.get('itemId') as string;
    const name = (formData.get('name') as string) || undefined;
    const file = formData.get('file') as File | null;

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'Missing file content' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const updatedItem = await replaceCloudFileContent(
      auth.userId,
      itemId,
      buffer,
      name || file.name,
      file.type
    );

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: 'File replaced successfully in Drive',
    });
  } catch (err: any) {
    console.error('[API /api/drive/item/replace] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to replace file content' }, { status: 500 });
  }
}
