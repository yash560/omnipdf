import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, verifyPassword } from '@/lib/auth/jwt';
import { findUserById, updateUserPassword } from '@/lib/auth/db';

export async function POST(req: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const userRecord = await findUserById(payload.sub);
    if (!userRecord) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify existing password
    const isMatch = await verifyPassword(
      currentPassword,
      userRecord.passwordHash,
      userRecord.passwordSalt
    );

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password. Please try again.' },
        { status: 400 }
      );
    }

    // Update password
    await updateUserPassword(payload.sub, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed securely!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
