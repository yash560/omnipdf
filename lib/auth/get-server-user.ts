import { NextRequest } from 'next/server';
import { verifyUserToken } from './jwt';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUserPayload | null> {
  try {
    // 1. Check HttpOnly cookie
    let token = req.cookies.get('omnipdf_token')?.value;

    // 2. Check Authorization Bearer header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const payload = await verifyUserToken(token);
    if (!payload || !payload.sub) return null;

    return {
      userId: payload.sub,
      email: payload.email || '',
      name: payload.name || 'User',
      role: payload.role || 'user',
      plan: payload.plan || 'pro',
    };
  } catch {
    return null;
  }
}
