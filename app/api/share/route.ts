import { NextRequest, NextResponse } from 'next/server';
import { EncryptedSharePackage } from '@/types/share';
import { saveEncryptedPackage } from '@/lib/storage/cloud-share-db';

export async function POST(req: NextRequest) {
  try {
    const pkg: EncryptedSharePackage = await req.json();

    if (!pkg || !pkg.id || !pkg.ciphertext || !pkg.iv || !pkg.salt) {
      return NextResponse.json(
        { error: 'Invalid encrypted package format. Missing cryptographic envelope.' },
        { status: 400 }
      );
    }

    await saveEncryptedPackage(pkg);

    return NextResponse.json({
      success: true,
      shareId: pkg.id,
      algorithm: pkg.algorithm,
      createdAt: pkg.createdAt,
      expiresAt: pkg.expiresAt,
    });
  } catch (err: any) {
    console.error('Failed to store encrypted share package:', err);
    return NextResponse.json({ error: 'Failed to create share package' }, { status: 500 });
  }
}
