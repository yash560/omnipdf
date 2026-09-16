import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getMongoDb } from '@/lib/db/mongodb';
import { DriveItem } from '@/lib/drive/drive-types';
import { generateSmartDossiers } from '@/lib/drive/dossier-generator';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isVaultUnlocked = searchParams.get('vaultUnlocked') === 'true';

    const db = await getMongoDb();
    const itemsCol = db.collection('filecraft_drive_items');

    const query: any = {
      $or: [
        { userId: auth.userId },
        { ownerEmail: auth.email.toLowerCase() },
        { 'sharedWith.userId': auth.userId },
        { 'sharedWith.email': auth.email.toLowerCase() },
      ],
      isTrash: false,
    };

    const rawDocs = await itemsCol.find(query).toArray();
    const allItems: DriveItem[] = rawDocs.map(({ _id, ...it }: any) => it as DriveItem);

    const dossiers = generateSmartDossiers(allItems, { isVaultUnlocked });

    return NextResponse.json({
      success: true,
      dossiers,
      totalDossiers: dossiers.length,
    });
  } catch (err: any) {
    console.error('[API /api/drive/dossiers] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch smart dossiers' }, { status: 500 });
  }
}
