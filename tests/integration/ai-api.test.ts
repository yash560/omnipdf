import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as handleBatchRename } from '../../app/api/ai/batch-rename/route';
import { POST as handleUniversalChat } from '../../app/api/ai/universal-chat/route';

export async function runAiApiTests() {
  console.log('🧪 Testing [AI API Endpoints & Resilience]...');

  // 1. Missing payload validation
  const badReq = new NextRequest('http://localhost:3000/api/ai/batch-rename', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const badRes = await handleBatchRename(badReq);
  assert.strictEqual(badRes.status, 400);

  // 2. Universal Chat - Empty Request
  const emptyChatReq = new NextRequest('http://localhost:3000/api/ai/universal-chat', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const emptyChatRes = await handleUniversalChat(emptyChatReq);
  assert.strictEqual(emptyChatRes.status, 400);

  // 3. Universal Chat - Single Message String (Backward Compatibility)
  const singleMsgReq = new NextRequest('http://localhost:3000/api/ai/universal-chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Summarize the items in this folder',
      fileContext: '[Doc #1] Name: Tax_Invoice.pdf | Category: Bills & Invoices | Tags: Invoice, Tax | Summary: June 2025 invoice for INR 45,000',
    }),
  });
  const singleMsgRes = await handleUniversalChat(singleMsgReq);
  assert.strictEqual(singleMsgRes.status, 200);
  const singleMsgData = await singleMsgRes.json();
  assert.ok(singleMsgData.success);
  assert.ok(typeof (singleMsgData.text || singleMsgData.response) === 'string');

  // 4. Universal Chat - Multi-Turn Messages with Folder RAG Context
  const multiTurnReq = new NextRequest('http://localhost:3000/api/ai/universal-chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'What is the total invoice amount?' },
      ],
      fileContext: '=== FOLDER DOCUMENTS CONTEXT: "Finance" (2 items) ===\n[Document #1] Name: "Inv_01.pdf" | Category: Bills & Invoices | Summary: INR 50,000\n[Document #2] Name: "Inv_02.pdf" | Category: Bills & Invoices | Summary: INR 30,000\n=== END FOLDER CONTEXT ===',
    }),
  });
  const multiTurnRes = await handleUniversalChat(multiTurnReq);
  assert.strictEqual(multiTurnRes.status, 200);
  const multiTurnData = await multiTurnRes.json();
  assert.ok(multiTurnData.success);
  assert.ok(multiTurnData.text.length > 0);

  console.log('  ✅ [AI API Endpoints & Resilience] passed all assertions.');
}

