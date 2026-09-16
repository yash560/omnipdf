import { MongoClient } from 'mongodb';
import { extractStructuredOcrData } from '../lib/ai/ocr-indexer';
import { detectDocumentExpiry } from '../lib/drive/expiry-tracker';
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

const MONGO_URI = process.env.MONGODB_URI || process.env.THEWEBVALE_MONGO_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'thewebvale';
const TARGET_EMAIL = 'yaashjainn@gmail.com';

async function main() {
  console.log(`\n======================================================`);
  console.log(`🔍 Enriching all documents with OCR Indexing & Expiry Radar for ${TARGET_EMAIL}`);
  console.log(`======================================================\n`);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const itemsCol = db.collection<DriveItem>('filecraft_drive_items');
  const user = await db.collection('filecraft_users').findOne({ email: TARGET_EMAIL });

  if (!user) throw new Error('User not found');
  const userId = user.id;

  const items = await itemsCol.find({ userId }).toArray();
  console.log(`Found ${items.length} items to index...`);

  let ocrCount = 0;
  let expiryCount = 0;
  let vaultCount = 0;

  for (const item of items) {
    const ocrData = extractStructuredOcrData(item.name, item.relativePath || '', item.tags || []);
    const expiry = detectDocumentExpiry(item);

    // Auto-mark highly sensitive items into Secure Vault
    const lowerName = item.name.toLowerCase();
    const lowerPath = (item.relativePath || '').toLowerCase();
    const isSensitive = 
      lowerName.includes('pan card') || 
      lowerName.includes('aadhaar') || 
      lowerName.includes('passport') || 
      lowerName.includes('credit card') || 
      lowerName.includes('debit card') || 
      lowerPath.includes('cards') || 
      lowerName.includes('cheque') ||
      lowerName.includes('passbook');

    const update: any = {
      ocrText: ocrData.text,
      expiryDate: expiry.expiryDate,
      expiryStatus: expiry.expiryStatus,
      expiryDaysLeft: expiry.expiryDaysLeft,
      expiryType: expiry.expiryType,
      expiryDetails: expiry.expiryDetails,
    };

    if (isSensitive) {
      update.isVault = true;
      vaultCount++;
    }

    await itemsCol.updateOne({ id: item.id }, { $set: update });
    ocrCount++;
    if (expiry.expiryStatus !== 'none') expiryCount++;
  }

  console.log(`\n======================================================`);
  console.log(` Complete!`);
  console.log(` OCR Text Indexed: ${ocrCount} items`);
  console.log(` Expiration Tracked: ${expiryCount} items`);
  console.log(` Marked as Secure Vault Items: ${vaultCount} items`);
  console.log(`======================================================\n`);

  await client.close();
}

main().catch(console.error);
