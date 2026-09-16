import fs from 'node:fs';
import path from 'node:path';

// Load .env.local into process.env for local test execution
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[match[1]] = value;
      }
    });
  }
} catch {}

import { runAuthApiTests } from './integration/auth-api.test';
import { runDriveCrudApiTests } from './integration/drive-crud-api.test';
import { runDriveCascadingFolderDeletionTests } from './integration/drive-cascading-folder-deletion.test';
import { runDriveFeaturesApiTests } from './integration/drive-features-api.test';
import { runDriveShareApiTests } from './integration/drive-share-api.test';
import { runSupportApiTests } from './integration/support-api.test';
import { runAiApiTests } from './integration/ai-api.test';

async function main() {
  console.log('========================================================');
  console.log('🚀 FILECRAFT / FILECRAFT DRIVE INTEGRATION & API TEST SUITE');
  console.log('========================================================\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const testSuites = [
    { name: 'auth-api', fn: runAuthApiTests },
    { name: 'drive-crud-api', fn: runDriveCrudApiTests },
    { name: 'drive-cascading-folder-deletion', fn: runDriveCascadingFolderDeletionTests },
    { name: 'drive-features-api', fn: runDriveFeaturesApiTests },
    { name: 'drive-share-api', fn: runDriveShareApiTests },
    { name: 'support-api', fn: runSupportApiTests },
    { name: 'ai-api', fn: runAiApiTests },
  ];

  for (const suite of testSuites) {
    try {
      await suite.fn();
      passed++;
    } catch (err: any) {
      console.error(`❌ Suite [${suite.name}] FAILED:`, err);
      failed++;
    }
  }

  const duration = Date.now() - startTime;
  console.log('\n========================================================');
  console.log(`📊 INTEGRATION RESULTS: ${passed} passed, ${failed} failed in ${duration}ms`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal integration test error:', err);
  process.exit(1);
});
