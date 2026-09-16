import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/auth/jwt';
import { findUserById, updateUser, sanitizeUser } from '@/lib/auth/db';

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('omnipdf_token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyUserToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let token = req.cookies.get('omnipdf_token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyUserToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar, preferences } = body;

    const updates: Record<string, any> = {};
    if (name && typeof name === 'string') updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferences && typeof preferences === 'object') updates.preferences = preferences;

    const updated = await updateUser(payload.sub, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updated,
      message: 'Profile updated successfully!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
