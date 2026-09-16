import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleGuestAuth } from '../../app/api/auth/guest/route';
import { GET as handleStats } from '../../app/api/drive/stats/route';
import { GET as handleSearch } from '../../app/api/drive/search/route';
import { GET as handleRecommendations } from '../../app/api/drive/recommendations/route';
import { POST as handleRecommendationFeedback } from '../../app/api/drive/recommendations/feedback/route';
import { GET as handleDossiers } from '../../app/api/drive/dossiers/route';
import { GET as handleExpiry } from '../../app/api/drive/expiry/route';
import { GET as handleDedup } from '../../app/api/drive/dedup/route';
import { GET as handleVaultGet, POST as handleVaultPost } from '../../app/api/drive/vault/route';

export async function runDriveFeaturesApiTests() {
  console.log('🧪 Testing [Drive Intelligence, Vault & Features API Endpoints]...');

  // 1. Authenticate Guest Session
  const guestRes = await handleGuestAuth();
  const guestData = await guestRes.json();
  const token = guestData.token;
  assert.ok(token);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 2. Storage Stats API
  const statsReq = new NextRequest('http://localhost:3000/api/drive/stats', {
    headers: authHeaders,
  });
  const statsRes = await handleStats(statsReq);
  const statsData = await statsRes.json();
  assert.strictEqual(statsRes.status, 200);
  assert.strictEqual(statsData.success, true);
  assert.ok(typeof statsData.stats.totalFiles === 'number');
  assert.ok(typeof statsData.stats.totalBytes === 'number');

  // 3. Search API
  const searchReq = new NextRequest('http://localhost:3000/api/drive/search?q=test', {
    headers: authHeaders,
  });
  const searchRes = await handleSearch(searchReq);
  const searchData = await searchRes.json();
  assert.strictEqual(searchRes.status, 200);
  assert.strictEqual(searchData.success, true);
  assert.ok(Array.isArray(searchData.items));
  assert.ok(Array.isArray(searchData.availableTags));

  // 4. Recommendations API
  const recReq = new NextRequest('http://localhost:3000/api/drive/recommendations', {
    headers: authHeaders,
  });
  const recRes = await handleRecommendations(recReq);
  const recData = await recRes.json();
  assert.strictEqual(recRes.status, 200);
  assert.strictEqual(recData.success, true);
  assert.ok(Array.isArray(recData.forYou));
  assert.ok(Array.isArray(recData.suggestedActions));
  assert.ok(Array.isArray(recData.dossiers));

  // 5. Recommendations Feedback API
  const fbReq = new NextRequest('http://localhost:3000/api/drive/recommendations/feedback', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      recommendationId: 'rec_test_1',
      action: 'dismiss',
      stream: 'for_you',
    }),
  });
  const fbRes = await handleRecommendationFeedback(fbReq);
  const fbData = await fbRes.json();
  assert.strictEqual(fbRes.status, 200);
  assert.strictEqual(fbData.success, true);

  // 6. Smart Dossiers API
  const dosReq = new NextRequest('http://localhost:3000/api/drive/dossiers', {
    headers: authHeaders,
  });
  const dosRes = await handleDossiers(dosReq);
  const dosData = await dosRes.json();
  assert.strictEqual(dosRes.status, 200);
  assert.strictEqual(dosData.success, true);
  assert.ok(Array.isArray(dosData.dossiers));

  // 7. Expiry Radar API
  const expReq = new NextRequest('http://localhost:3000/api/drive/expiry', {
    headers: authHeaders,
  });
  const expRes = await handleExpiry(expReq);
  const expData = await expRes.json();
  assert.strictEqual(expRes.status, 200);
  assert.ok(Array.isArray(expData.items));
  assert.ok(typeof expData.summary.expired === 'number');

  // 8. Dedup Duplicate Scan API
  const dedupReq = new NextRequest('http://localhost:3000/api/drive/dedup', {
    headers: authHeaders,
  });
  const dedupRes = await handleDedup(dedupReq);
  const dedupData = await dedupRes.json();
  assert.strictEqual(dedupRes.status, 200);
  assert.ok(Array.isArray(dedupData.clusters));

  // 9. Vault PIN Lifecycle API
  // Check initial state (should have hasPin: false)
  const vGetReq1 = new NextRequest('http://localhost:3000/api/drive/vault', {
    headers: authHeaders,
  });
  const vGetRes1 = await handleVaultGet(vGetReq1);
  const vGetData1 = await vGetRes1.json();
  assert.strictEqual(vGetRes1.status, 200);
  assert.strictEqual(vGetData1.success, true);

  // Set initial PIN
  const vSetPinReq = new NextRequest('http://localhost:3000/api/drive/vault', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'set_pin',
      newPin: '9876',
    }),
  });
  const vSetPinRes = await handleVaultPost(vSetPinReq);
  const vSetPinData = await vSetPinRes.json();
  assert.strictEqual(vSetPinRes.status, 200);
  assert.strictEqual(vSetPinData.success, true);

  // Verify PIN with wrong PIN (must return 403)
  const vFailPinReq = new NextRequest('http://localhost:3000/api/drive/vault', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'verify_pin',
      pin: '0000',
    }),
  });
  const vFailPinRes = await handleVaultPost(vFailPinReq);
  assert.strictEqual(vFailPinRes.status, 403);

  // Verify PIN with correct PIN (must return 200 and unlockedUntil timestamp)
  const vSuccessPinReq = new NextRequest('http://localhost:3000/api/drive/vault', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'verify_pin',
      pin: '9876',
    }),
  });
  const vSuccessPinRes = await handleVaultPost(vSuccessPinReq);
  const vSuccessPinData = await vSuccessPinRes.json();
  assert.strictEqual(vSuccessPinRes.status, 200);
  assert.strictEqual(vSuccessPinData.success, true);
  assert.ok(vSuccessPinData.unlockedUntil > Date.now());

  console.log('  ✅ [Drive Intelligence, Vault & Features API Endpoints] passed all assertions.');
}
