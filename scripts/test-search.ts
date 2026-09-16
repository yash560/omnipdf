import { MongoClient } from 'mongodb';
import { searchDriveItems } from '../lib/drive/search-engine';
import { DriveItem } from '../lib/drive/drive-types';
import path from 'path';
import fs from 'fs';

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

loadEnv();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://yaashjainn:2CfKwxYEOFqjowmn@webverse.5exbv3u.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.MONGODB_DB || 'thewebvale';
const TARGET_EMAIL = 'yaashjainn@gmail.com';

async function testSearch() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const itemsCol = db.collection<DriveItem>('filecraft_drive_items');
  const user = await db.collection('filecraft_users').findOne({ email: TARGET_EMAIL });

  if (!user) throw new Error('User not found');
  const userId = user.id;

  const allItems = await itemsCol.find({ userId, isTrash: false }).toArray();
  console.log(`Loaded ${allItems.length} total drive items for user ${user.name} (${user.email})\n`);

  const testQueries = [
    'salary slip',
    'dad adhar', // typo intended
    'amaze rc',
    'car insurance',
    'shreya passprt', // typo intended
    'property tax ishan park',
    'pulsar 150',
    'offer letter',
    'pan card',
  ];

  for (const q of testQueries) {
    console.log(`\n======================================================`);
    console.log(`🔎 Testing Search Query: "${q}"`);
    console.log(`======================================================`);

    const result = searchDriveItems(allItems as any, { query: q });

    console.log(`Found ${result.totalMatches} matches (top 4 shown):`);
    result.items.slice(0, 4).forEach((item, i) => {
      console.log(`  ${i + 1}. [Score: ${item.searchScore}] ${item.name}`);
      console.log(`     Path: ${item.relativePath || item.name}`);
      console.log(`     Tags: [${(item.tags || []).join(', ')}] | AI Cat: ${item.aiCategory || 'N/A'}`);
      if (item.matchedTerms?.length) {
        console.log(`     Matched: ${item.matchedTerms.join(', ')}`);
      }
    });

    console.log(`  Top Tag Facets: ${result.availableTags.slice(0, 5).map(t => `${t.tag} (${t.count})`).join(', ')}`);
  }

  await client.close();
}

testSearch().catch(console.error);
