import { NextResponse } from 'next/server';
import { createGuestUser, sanitizeUser } from '@/lib/auth/db';
import { signUserToken } from '@/lib/auth/jwt';

export async function POST() {
  try {
    const guestUser = await createGuestUser();
    const safeUser = sanitizeUser(guestUser);
    const token = await signUserToken(safeUser);

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: 'Logged in with instant Guest Pro access!',
    });

    response.cookies.set('omnipdf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Guest login failed' }, { status: 500 });
  }
}
