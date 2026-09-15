import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/auth/jwt';
import { findUserById, sanitizeUser } from '@/lib/auth/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Check HttpOnly cookie
    let token = req.cookies.get('omnipdf_token')?.value;

    // 2. Check Authorization Bearer header fallback
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyUserToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userRecord = await findUserById(payload.sub);
    if (!userRecord) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      user: sanitizeUser(userRecord),
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err.message }, { status: 200 });
  }
}
