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
    const safeUser = userRecord ? sanitizeUser(userRecord) : {
      id: payload.sub,
      name: payload.name || 'User',
      email: payload.email || '',
      role: payload.role || 'user',
      plan: payload.plan || 'pro',
      createdAt: (payload.iat ? payload.iat * 1000 : Date.now()),
      lastLoginAt: Date.now(),
      usage: {
        documentsCount: 0,
        aiQueriesUsed: 0,
        storageBytes: 0,
        maxStorageBytes: 1_000_000_000,
      },
      preferences: {
        defaultFont: 'Plus Jakarta Sans',
        theme: 'dark',
        autoSaveInterval: 1200,
      },
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err.message }, { status: 200 });
  }
}
