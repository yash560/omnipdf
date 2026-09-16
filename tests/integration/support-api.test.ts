import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleCreateTicket } from '../../app/api/support/ticket/route';

export async function runSupportApiTests() {
  console.log('🧪 Testing [Support Ticket API Endpoint]...');

  // 1. Validation error on missing fields
  const badReq = new NextRequest('http://localhost:3000/api/support/ticket', {
    method: 'POST',
    body: JSON.stringify({ name: 'User' }), // missing email, subject, message
  });
  const badRes = await handleCreateTicket(badReq);
  assert.strictEqual(badRes.status, 400);

  // 2. Successful Ticket Creation
  const goodReq = new NextRequest('http://localhost:3000/api/support/ticket', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Yash Test',
      email: 'test@filecraft.test',
      category: 'drive',
      priority: 'high',
      subject: 'Drive Auto-Label verification',
      message: 'Testing production support ticket dispatch and persistence.',
      diagnostics: {
        browser: 'Playwright/Chrome Headless',
        os: 'macOS',
        onlineStatus: true,
      },
    }),
  });
  const goodRes = await handleCreateTicket(goodReq);
  const goodData = await goodRes.json();
  assert.strictEqual(goodRes.status, 200);
  assert.strictEqual(goodData.success, true);
  assert.ok(goodData.ticket.ticketNumber.startsWith('FC-'));
  assert.strictEqual(goodData.ticket.userEmail, 'test@filecraft.test');

  console.log('  ✅ [Support Ticket API Endpoint] passed all assertions.');
}
