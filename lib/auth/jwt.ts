import { User } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'omnipdf-master-jwt-secret-2026-zero-knowledge';

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(JWT_SECRET) as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign a JWT token for a user
 */
export async function signUserToken(user: User, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign) as any
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.length; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  const signatureB64 = base64UrlEncode(binary);

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verify a JWT token and extract payload
 */
export async function verifyUserToken(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const key = await getHmacKey();
    const signatureBinary = base64UrlDecode(signatureB64);
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as any,
      new TextEncoder().encode(dataToVerify) as any
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Hash password with random salt using SHA-256
 */
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex || Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash, salt };
}

/**
 * Verify password against stored hash & salt
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}
