import assert from 'node:assert';
import { signUserToken, verifyUserToken, hashPassword, verifyPassword } from '../../lib/auth/jwt';
import { User } from '../../types/auth';

export async function runJwtAuthTests() {
  console.log('🧪 Testing [lib/auth/jwt.ts]...');

  const mockUser = {
    id: 'usr_test_123',
    email: 'test@filecraft.io',
    name: 'Yash Jain',
    role: 'user',
    plan: 'free',
  } as unknown as User;

  // 1. JWT Signing & Verification
  const token = await signUserToken(mockUser, 3600);
  assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Token should be valid 3-part JWT');

  const payload = await verifyUserToken(token);
  assert.ok(payload, 'Token should verify successfully');
  assert.strictEqual(payload.sub, mockUser.id);
  assert.strictEqual(payload.email, mockUser.email);
  assert.strictEqual(payload.name, mockUser.name);

  // 2. Tampered Token Verification Rejection
  const tamperedToken = token.slice(0, -5) + 'XXXXX';
  const tamperedPayload = await verifyUserToken(tamperedToken);
  assert.strictEqual(tamperedPayload, null, 'Tampered token must fail verification');

  // 3. Expired Token Verification Rejection
  const expiredToken = await signUserToken(mockUser, -10); // expired 10s ago
  const expiredPayload = await verifyUserToken(expiredToken);
  assert.strictEqual(expiredPayload, null, 'Expired token must return null');

  // 4. Password Hashing & Verification
  const password = 'SuperSecretPassword2026!';
  const { hash, salt } = await hashPassword(password);
  assert.ok(hash && hash.length === 64, 'SHA-256 hash must be 64 hex characters');
  assert.ok(salt && salt.length === 32, 'Salt must be 32 hex characters');

  const isCorrect = await verifyPassword(password, hash, salt);
  assert.strictEqual(isCorrect, true, 'Correct password must verify');

  const isWrong = await verifyPassword('WrongPassword123', hash, salt);
  assert.strictEqual(isWrong, false, 'Wrong password must fail verification');

  console.log('  ✅ [lib/auth/jwt.ts] passed all assertions.');
}
