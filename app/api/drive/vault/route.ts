import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import crypto from 'crypto';

function hashPinV2(pin: string, userId: string): string {
  const salt = `fc_vault_${userId}_salt_2026`;
  return `v2:${crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('hex')}`;
}

function verifyStoredPin(pin: string, storedHash: string, userId: string): boolean {
  try {
    if (storedHash.startsWith('v2:')) {
      const salt = `fc_vault_${userId}_salt_2026`;
      const computed = `v2:${crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('hex')}`;
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
    }
    // Legacy v1 fallback
    const legacySalt = 'filecraft_vault_salt';
    const legacyComputed = crypto.pbkdf2Sync(pin, legacySalt, 1000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(legacyComputed), Buffer.from(storedHash));
  } catch {
    return false;
  }
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
    const autoLockMinutes = userDoc?.preferences?.vaultAutoLockMinutes || 15;

    return NextResponse.json({
      success: true,
      hasPin,
      vaultItemsCount,
      autoLockMinutes,
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
    const { action, pin, currentPin, newPin, autoLockMinutes } = body;
    const db = await getMongoDb();
    const userDoc = await db.collection('filecraft_users').findOne({
      $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }]
    });

    const storedHash = userDoc?.preferences?.vaultPinHash;

    // 1. Initial Set PIN (When no PIN exists)
    if (action === 'set_pin') {
      if (!newPin || newPin.length < 4 || newPin.length > 6) {
        return NextResponse.json({ error: 'PIN must be 4 to 6 digits.' }, { status: 400 });
      }

      if (storedHash && !currentPin) {
        return NextResponse.json({ error: 'Current PIN is required to set a new PIN.' }, { status: 400 });
      }

      if (storedHash && currentPin) {
        if (!verifyStoredPin(currentPin, storedHash, auth.userId)) {
          return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 403 });
        }
      }

      const pinHash = hashPinV2(newPin, auth.userId);
      await db.collection('filecraft_users').updateOne(
        { $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }] },
        { 
          $set: { 
            'preferences.vaultPinHash': pinHash, 
            'preferences.vaultAutoLockMinutes': autoLockMinutes || 15,
            updatedAt: Date.now() 
          } 
        },
        { upsert: false }
      );

      return NextResponse.json({ success: true, message: 'Vault PIN configured successfully.' });
    }

    // 2. Change PIN (Requires current PIN)
    if (action === 'change_pin') {
      if (!currentPin) {
        return NextResponse.json({ error: 'Current PIN is required.' }, { status: 400 });
      }
      if (!newPin || newPin.length < 4 || newPin.length > 6) {
        return NextResponse.json({ error: 'New PIN must be 4 to 6 digits.' }, { status: 400 });
      }

      if (!storedHash) {
        return NextResponse.json({ error: 'No PIN is configured yet. Please set an initial PIN.' }, { status: 400 });
      }

      if (!verifyStoredPin(currentPin, storedHash, auth.userId)) {
        return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 403 });
      }

      const newHash = hashPinV2(newPin, auth.userId);
      await db.collection('filecraft_users').updateOne(
        { $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }] },
        { 
          $set: { 
            'preferences.vaultPinHash': newHash, 
            updatedAt: Date.now() 
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Vault PIN updated successfully.' });
    }

    // 3. Update Settings (e.g. Auto-lock timeout)
    if (action === 'update_settings') {
      const minutes = Number(autoLockMinutes) || 15;
      await db.collection('filecraft_users').updateOne(
        { $or: [{ id: auth.userId }, { email: auth.email.toLowerCase() }] },
        { 
          $set: { 
            'preferences.vaultAutoLockMinutes': minutes,
            updatedAt: Date.now() 
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Vault settings updated successfully.', autoLockMinutes: minutes });
    }

    // 4. Verify PIN (Unlock Vault)
    if (action === 'verify_pin') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN is required.' }, { status: 400 });
      }

      if (!storedHash) {
        return NextResponse.json({ error: 'No PIN has been configured for your vault.' }, { status: 400 });
      }

      if (!verifyStoredPin(pin, storedHash, auth.userId)) {
        return NextResponse.json({ error: 'Incorrect PIN. Access denied.' }, { status: 403 });
      }

      const lockDurationMinutes = userDoc?.preferences?.vaultAutoLockMinutes || 15;
      const unlockedUntil = Date.now() + lockDurationMinutes * 60 * 1000;

      return NextResponse.json({
        success: true,
        message: 'Vault unlocked.',
        unlockedUntil,
        autoLockMinutes: lockDurationMinutes,
      });
    }

    return NextResponse.json({ error: 'Invalid vault action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process vault action' }, { status: 500 });
  }
}
