import fs from 'node:fs';
import path from 'node:path';

// 1. Load environment variables from .env.local
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

// Unit Suites
import { runHelpersTests } from './unit/helpers.test';
import { runSearchEngineTests } from './unit/search-engine.test';
import { runRecommendationsTests } from './unit/recommendations.test';
import { runDedupTests } from './unit/dedup-engine.test';
import { runExpiryTests } from './unit/expiry-tracker.test';
import { runJwtAuthTests } from './unit/jwt-auth.test';
import { runDossierTests } from './unit/dossier-generator.test';
import { runToolsEnginesTests } from './unit/tools-engines.test';

// Integration Suites
import { runAuthApiTests } from './integration/auth-api.test';
import { runDriveCrudApiTests } from './integration/drive-crud-api.test';
import { runDriveFeaturesApiTests } from './integration/drive-features-api.test';
import { runDriveShareApiTests } from './integration/drive-share-api.test';
import { runSupportApiTests } from './integration/support-api.test';
import { runAiApiTests } from './integration/ai-api.test';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🛡️  FILECRAFT MASTER PRODUCTION TEST SUITE RUNNER       ║');
  console.log('║           Zero-Knowledge File OS & Drive Ecosystem           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  let passedSuites = 0;
  let failedSuites = 0;

  const testSuites = [
    // UNIT TIER
    { tier: 'UNIT', name: 'drive-helpers', fn: runHelpersTests },
    { tier: 'UNIT', name: 'search-engine', fn: runSearchEngineTests },
    { tier: 'UNIT', name: 'recommendation-engine', fn: runRecommendationsTests },
    { tier: 'UNIT', name: 'dedup-engine', fn: runDedupTests },
    { tier: 'UNIT', name: 'expiry-tracker', fn: runExpiryTests },
    { tier: 'UNIT', name: 'jwt-auth-cryptography', fn: runJwtAuthTests },
    { tier: 'UNIT', name: 'dossier-generator', fn: runDossierTests },
    { tier: 'UNIT', name: 'specialized-tools-engines', fn: runToolsEnginesTests },

    // INTEGRATION TIER
    { tier: 'INTEGRATION', name: 'auth-api-endpoints', fn: runAuthApiTests },
    { tier: 'INTEGRATION', name: 'drive-crud-api-endpoints', fn: runDriveCrudApiTests },
    { tier: 'INTEGRATION', name: 'drive-intelligence-vault-api', fn: runDriveFeaturesApiTests },
    { tier: 'INTEGRATION', name: 'drive-sharing-collaboration-api', fn: runDriveShareApiTests },
    { tier: 'INTEGRATION', name: 'support-ticket-api', fn: runSupportApiTests },
    { tier: 'INTEGRATION', name: 'ai-api-endpoints-resilience', fn: runAiApiTests },
  ];

  console.log(`📋 Dispatched ${testSuites.length} comprehensive test suites across 2 execution tiers...\n`);

  for (const suite of testSuites) {
    const suiteStart = Date.now();
    try {
      await suite.fn();
      passedSuites++;
      const duration = Date.now() - suiteStart;
      console.log(`  ⏱️  [${suite.tier}] [${suite.name}] completed in ${duration}ms\n`);
    } catch (err: any) {
      console.error(`❌ [${suite.tier}] [${suite.name}] FAILED:`, err);
      failedSuites++;
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║               📊 FINAL EXECUTION SUMMARY REPORT               ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Suites Executed : ${testSuites.length.toString().padEnd(35)}║`);
  console.log(`║  Suites Passed         : ${passedSuites.toString().padEnd(35)}║`);
  console.log(`║  Suites Failed         : ${failedSuites.toString().padEnd(35)}║`);
  console.log(`║  Execution Duration    : ${(totalDuration + 's').padEnd(35)}║`);
  console.log(`║  Ecosystem Health      : ${(failedSuites === 0 ? '🟢 100% PRODUCTION READY' : '🔴 ACTION REQUIRED').padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failedSuites > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
