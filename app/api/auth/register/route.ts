import { NextRequest, NextResponse } from 'next/server';
import { createUser, sanitizeUser } from '@/lib/auth/db';
import { signUserToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, plan } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      name,
      email,
      password,
      plan: plan || 'pro',
    });

    const safeUser = sanitizeUser(newUser);
    const token = await signUserToken(safeUser);

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: 'Account created successfully! Enjoy your Pro trial.',
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
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
