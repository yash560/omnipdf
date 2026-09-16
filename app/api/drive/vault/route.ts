import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import crypto from 'crypto';

function hashPin(pin: string, salt: string = 'filecraft_vault_salt'): string {
  return crypto.pbkdf2Sync(pin, salt, 1000, 32, 'sha256').toString('hex');
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getMongoDb();
    const userDoc = await db.collection('filecraft_users').findOne({
      $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }]
    });
    const vaultItemsCount = await db.collection('filecraft_drive_items').countDocuments({
      userId: auth.userId,
      isVault: true,
      isTrash: false,
    });

    const hasPin = Boolean(userDoc?.preferences?.vaultPinHash);

    return NextResponse.json({
      hasPin,
      vaultItemsCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check vault status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, pin, newPin } = body;
    const db = await getMongoDb();
    const userDoc = await db.collection('filecraft_users').findOne({
      $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }]
    });

    if (action === 'set_pin') {
      if (!newPin || newPin.length < 4) {
        return NextResponse.json({ error: 'PIN must be at least 4 digits.' }, { status: 400 });
      }

      const pinHash = hashPin(newPin);
      await db.collection('filecraft_users').updateOne(
        { $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }] },
        { $set: { 'preferences.vaultPinHash': pinHash, updatedAt: Date.now() } }
      );

      return NextResponse.json({ success: true, message: 'Vault PIN set successfully.' });
    }

    if (action === 'verify_pin') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN is required.' }, { status: 400 });
      }

      const storedHash = userDoc?.preferences?.vaultPinHash;
      if (!storedHash) {
        return NextResponse.json({ error: 'No PIN has been configured for your vault.' }, { status: 400 });
      }

      const inputHash = hashPin(pin);
      if (inputHash !== storedHash) {
        return NextResponse.json({ error: 'Incorrect PIN. Access denied.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        message: 'Vault unlocked.',
        unlockedUntil: Date.now() + 15 * 60 * 1000, // 15 min unlock window
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process vault action' }, { status: 500 });
  }
}
