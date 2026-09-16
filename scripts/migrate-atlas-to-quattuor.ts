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

async function migrate() {
  loadEnv();
  const sourceUri = process.env.MONGODB_URI;
  if (!sourceUri) throw new Error('MONGODB_URI not found');

  const targetUri = process.env.QUATTUOR_MONGODB_URI || 'mongodb://127.0.0.1:27018';
  const dbName = process.env.MONGODB_DB || 'thewebvale';

  console.log(`🚀 Starting Full Migration from Atlas to Quattuor Node...`);
  console.log(`📍 Source: Atlas (DB: ${dbName})`);
  console.log(`📍 Target: Quattuor (URI: ${targetUri}, DB: ${dbName})`);

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  await sourceClient.connect();
  console.log(`✅ Connected to Source (Atlas)`);

  await targetClient.connect();
  console.log(`✅ Connected to Target (Quattuor Node)`);

  const sourceDb = sourceClient.db(dbName);
  const targetDb = targetClient.db(dbName);

  // List all collections in source
  const collections = await sourceDb.listCollections().toArray();
  console.log(`\n📦 Found ${collections.length} collections in source DB '${dbName}':`);

  let totalSourceDocs = 0;
  let totalTargetDocs = 0;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith('system.')) continue;

    console.log(`\n--------------------------------------------------`);
    console.log(`⏳ Processing Collection: '${collName}'...`);

    const sourceColl = sourceDb.collection(collName);
    const targetColl = targetDb.collection(collName);

    const count = await sourceColl.countDocuments();
    totalSourceDocs += count;
    console.log(`   Source doc count: ${count}`);

    if (count === 0) {
      console.log(`   Skipping empty collection '${collName}'`);
      continue;
    }

    // Sync Indexes
    try {
      const indexes = await sourceColl.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const keys = idx.key;
        const options: any = { name: idx.name };
        if (idx.unique) options.unique = true;
        if (idx.sparse) options.sparse = true;
        if (idx.expireAfterSeconds !== undefined) options.expireAfterSeconds = idx.expireAfterSeconds;
        try {
          await targetColl.createIndex(keys, options);
          console.log(`   + Index preserved: ${idx.name}`);
        } catch (idxErr: any) {
          console.warn(`   ! Index creation warning on ${idx.name}: ${idxErr.message}`);
        }
      }
    } catch (e: any) {
      console.warn(`   ! Could not fetch indexes: ${e.message}`);
    }

    // Copy Data in batches of 200
    const cursor = sourceColl.find({});
    let batch: any[] = [];
    let processed = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      batch.push(doc);

      if (batch.length >= 200) {
        const ops = batch.map((d) => ({
          replaceOne: {
            filter: { _id: d._id },
            replacement: d,
            upsert: true,
          },
        }));
        await targetColl.bulkWrite(ops, { ordered: false });
        processed += batch.length;
        process.stdout.write(`\r   Progress: ${processed}/${count} docs migrated`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      const ops = batch.map((d) => ({
        replaceOne: {
          filter: { _id: d._id },
          replacement: d,
          upsert: true,
        },
      }));
      await targetColl.bulkWrite(ops, { ordered: false });
      processed += batch.length;
      process.stdout.write(`\r   Progress: ${processed}/${count} docs migrated`);
    }

    const targetCount = await targetColl.countDocuments();
    totalTargetDocs += targetCount;
    console.log(`\n   ✅ Target doc count: ${targetCount} (${targetCount === count ? 'MATCH 100%' : 'MISMATCH'})`);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Migration Completed!`);
  console.log(`📊 Total Source Docs: ${totalSourceDocs} | Total Target Docs: ${totalTargetDocs}`);

  // Verification checks
  console.log(`\n🔍 Verifying Key Drive Collections on Quattuor:`);
  const driveItemsCount = await targetDb.collection('filecraft_drive_items').countDocuments();
  const gridfsFilesCount = await targetDb.collection('filecraft_drive_storage.files').countDocuments();
  const gridfsChunksCount = await targetDb.collection('filecraft_drive_storage.chunks').countDocuments();
  const usersCount = await targetDb.collection('filecraft_users').countDocuments();

  console.log(` - filecraft_drive_items: ${driveItemsCount} items`);
  console.log(` - filecraft_drive_storage.files: ${gridfsFilesCount} files`);
  console.log(` - filecraft_drive_storage.chunks: ${gridfsChunksCount} chunks`);
  console.log(` - filecraft_users: ${usersCount} users`);

  // Quick latency benchmark
  console.log(`\n⚡ Measuring Quattuor MongoDB Read Latency:`);
  const t0 = performance.now();
  const sample = await targetDb.collection('filecraft_drive_items').find({}).limit(50).toArray();
  const t1 = performance.now();
  console.log(` - Fetched 50 drive items in ${(t1 - t0).toFixed(2)} ms (over SSH tunnel)!`);

  await sourceClient.close();
  await targetClient.close();
}

migrate().catch(console.error);
