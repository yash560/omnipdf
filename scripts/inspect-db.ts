import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

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

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');
  const client = new MongoClient(uri);
  await client.connect();

  const adminDb = client.db().admin();
  const dbs = await adminDb.listDatabases();
  console.log('=== Databases Sorted by Size ===');
  
  const sortedDbs = dbs.databases.sort((a, b) => b.sizeOnDisk - a.sizeOnDisk);

  for (const dbInfo of sortedDbs) {
    const dbSizeMb = (dbInfo.sizeOnDisk / (1024 * 1024)).toFixed(2);
    console.log(`\n📁 Database: ${dbInfo.name} (${dbSizeMb} MB)`);
    const db = client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      try {
        const stats = await db.command({ collStats: coll.name });
        const sizeMb = ((stats.storageSize || stats.size || 0) / (1024 * 1024)).toFixed(2);
        if (parseFloat(sizeMb) > 0.05 || stats.count > 0) {
          console.log(`    - ${coll.name}: ${sizeMb} MB (${stats.count || 0} docs, avg ${((stats.avgObjSize || 0) / 1024).toFixed(1)} KB)`);
        }
      } catch (e: any) {
        console.log(`    - ${coll.name}: (error: ${e.message})`);
      }
    }
  }
  await client.close();
}

main().catch(console.error);
