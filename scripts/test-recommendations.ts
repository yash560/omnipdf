import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { generateForYouFeed, generateSuggestedActions, generateRelatedItems } from '../lib/drive/recommendation-engine';
import { generateSmartDossiers } from '../lib/drive/dossier-generator';
import { DriveItem } from '../lib/drive/drive-types';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[match[1]] = val;
      }
    }
  }
}

async function test() {
  loadEnv();
  const uri = process.env.QUATTUOR_MONGODB_URI || 'mongodb://127.0.0.1:27018';
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db('thewebvale');
  const items = (await db.collection('filecraft_drive_items').find({ isTrash: false }).toArray()) as any as DriveItem[];

  console.log(`\n======================================================`);
  console.log(`🧪 Testing FileCraft Drive Recommendation Model`);
  console.log(`📊 Total Active Items Evaluated: ${items.length}`);
  console.log(`======================================================\n`);

  // 1. Test "Suggested For You" Feed
  const t0 = performance.now();
  const forYou = generateForYouFeed(items, { currentHour: 14, dayOfWeek: 3, isVaultUnlocked: true }, 6);
  const t1 = performance.now();

  console.log(`🌟 1. "Suggested For You" Feed (${(t1 - t0).toFixed(2)} ms):`);
  forYou.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. [Score: ${rec.score}] ${rec.item.name} (${rec.item.relativePath || 'root'})`);
    console.log(`      ↳ Rationale: "${rec.rationale}" | Confidence: ${rec.confidence} | Badge: ${rec.badgeText}`);
  });

  // 2. Test "Contextual Actions & Quick Fixes"
  const actions = generateSuggestedActions(items, { isVaultUnlocked: true }, 5);
  console.log(`\n⚡ 2. "Contextual Actions & Quick Fixes":`);
  actions.forEach((act, idx) => {
    console.log(`   ${idx + 1}. [${act.actionType?.toUpperCase()}] ${act.rationale}`);
  });

  // 3. Test "Smart Dossiers"
  const dossiers = generateSmartDossiers(items, { isVaultUnlocked: true });
  console.log(`\n📁 3. "Smart Dossiers" (${dossiers.length} auto-curated dossiers):`);
  dossiers.forEach((dos, idx) => {
    const sizeMb = (dos.totalBytes / (1024 * 1024)).toFixed(2);
    console.log(`   ${idx + 1}. 📂 ${dos.title} [Completeness: ${dos.completenessScore}% | Status: ${dos.status}]`);
    console.log(`      ↳ ${dos.items.length} items (${sizeMb} MB) | Category: ${dos.category}`);
    console.log(`      ↳ Highlights: ${dos.keyHighlights.join(' | ')}`);
  });

  // 4. Test "Related Items" for a sample document
  const sample = items.find((i) => i.name.includes('Relieving Letter') || i.name.includes('Salary Slip'));
  if (sample) {
    console.log(`\n🔗 4. "Related Documents" for: "${sample.name}":`);
    const related = generateRelatedItems(sample, items, { isVaultUnlocked: true }, 5);
    related.forEach((rel, idx) => {
      console.log(`   ${idx + 1}. [${rel.similarityScore}% Match] ${rel.item.name} (${rel.item.relativePath || 'root'})`);
      console.log(`      ↳ ${rel.rationale}`);
    });
  }

  await client.close();
  console.log(`\n✅ Recommendation Model Verification Completed Successfully!\n`);
}

test().catch(console.error);
