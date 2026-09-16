import { NextRequest, NextResponse } from 'next/server';
import { getEncryptedPackage, deleteEncryptedPackage } from '@/lib/storage/cloud-share-db';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    const pkg = await getEncryptedPackage(id);
    if (!pkg) {
      return NextResponse.json(
        { error: 'Share link expired, reached view limit, or does not exist.' },
        { status: 404 }
      );
    }

    // Return the zero-knowledge encrypted package
    return NextResponse.json(pkg);
  } catch (err: any) {
    console.error('Error retrieving share package:', err);
    return NextResponse.json({ error: 'Failed to retrieve package' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized to revoke this share link' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    const deleted = await deleteEncryptedPackage(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to revoke link' }, { status: 500 });
  }
}
