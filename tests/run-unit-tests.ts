import { runHelpersTests } from './unit/helpers.test';
import { runSearchEngineTests } from './unit/search-engine.test';
import { runRecommendationsTests } from './unit/recommendations.test';
import { runDedupTests } from './unit/dedup-engine.test';
import { runExpiryTests } from './unit/expiry-tracker.test';
import { runJwtAuthTests } from './unit/jwt-auth.test';
import { runDossierTests } from './unit/dossier-generator.test';

async function main() {
  console.log('========================================================');
  console.log('🚀 FILECRAFT / FILECRAFT DRIVE CORE UNIT TEST SUITE');
  console.log('========================================================\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const testSuites = [
    { name: 'drive-helpers', fn: runHelpersTests },
    { name: 'search-engine', fn: runSearchEngineTests },
    { name: 'recommendations', fn: runRecommendationsTests },
    { name: 'dedup-engine', fn: runDedupTests },
    { name: 'expiry-tracker', fn: runExpiryTests },
    { name: 'jwt-auth', fn: runJwtAuthTests },
    { name: 'dossier-generator', fn: runDossierTests },
  ];

  for (const suite of testSuites) {
    try {
      await suite.fn();
      passed++;
    } catch (err: any) {
      console.error(`❌ Suite [${suite.name}] FAILED:`, err.message);
      failed++;
    }
  }

  const duration = Date.now() - startTime;
  console.log('\n========================================================');
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed in ${duration}ms`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
