import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleGuestAuth } from '../../app/api/auth/guest/route';
import { POST as handleRegister } from '../../app/api/auth/register/route';
import { POST as handleLogin } from '../../app/api/auth/login/route';
import { GET as handleMe } from '../../app/api/auth/me/route';
import { POST as handleLogout } from '../../app/api/auth/logout/route';
import { PATCH as handleUpdateProfile } from '../../app/api/user/profile/route';

export async function runAuthApiTests() {
  console.log('🧪 Testing [Auth & User API Endpoints]...');

  // 1. Instant Guest Pro Auth
  const guestRes = await handleGuestAuth();
  const guestData = await guestRes.json();
  assert.strictEqual(guestRes.status, 200);
  assert.strictEqual(guestData.success, true);
  assert.ok(guestData.token, 'Guest auth must return JWT token');
  assert.ok(guestData.user.id.startsWith('usr_guest_') || guestData.user.id.length > 0);
  assert.strictEqual(guestData.user.plan, 'pro');

  // 2. /api/auth/me with Bearer token
  const meReq = new NextRequest('http://localhost:3000/api/auth/me', {
    headers: {
      Authorization: `Bearer ${guestData.token}`,
    },
  });
  const meRes = await handleMe(meReq);
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meData.success, true);
  assert.strictEqual(meData.user.id, guestData.user.id);

  // 3. /api/auth/register Validation Checks
  const badReq1 = new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }), // missing name & password
  });
  const badRes1 = await handleRegister(badReq1);
  assert.strictEqual(badRes1.status, 400);

  const badReq2 = new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User', email: 'test@example.com', password: '123' }), // <6 chars
  });
  const badRes2 = await handleRegister(badReq2);
  assert.strictEqual(badRes2.status, 400);

  // 4. Valid Registration
  const testEmail = `qa_test_${Date.now()}@filecraft.test`;
  const regReq = new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'QA Test User',
      email: testEmail,
      password: 'ProductionPassword2026!',
    }),
  });
  const regRes = await handleRegister(regReq);
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 200);
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.user.email, testEmail);

  // 5. Login Failure on Wrong Password
  const failLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword!',
    }),
  });
  const failLoginRes = await handleLogin(failLoginReq);
  assert.strictEqual(failLoginRes.status, 401);

  // 6. Login Success
  const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'ProductionPassword2026!',
    }),
  });
  const loginRes = await handleLogin(loginReq);
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginData.success, true);
  assert.ok(loginData.token);

  // 7. Update Profile
  const updateReq = new NextRequest('http://localhost:3000/api/user/profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      name: 'QA Test User Renamed',
      preferences: {
        theme: 'light',
      },
    }),
  });
  const updateRes = await handleUpdateProfile(updateReq);
  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateData.success, true);

  // 8. Logout
  const logoutRes = await handleLogout();
  assert.strictEqual(logoutRes.status, 200);

  console.log('  ✅ [Auth & User API Endpoints] passed all assertions.');
}
