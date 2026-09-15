import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, sanitizeUser } from '@/lib/auth/db';
import { verifyPassword, signUserToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    user.lastLoginAt = Date.now();
    const safeUser = sanitizeUser(user);
    const token = await signUserToken(safeUser);

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: `Welcome back, ${safeUser.name}!`,
    });

    // Set secure HTTP-only cookie
    response.cookies.set('omnipdf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
