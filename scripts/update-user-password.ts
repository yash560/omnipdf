import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const data = Buffer.from(`${salt}:${password}`);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return { hash, salt };
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI || process.env.THEWEBVALE_MONGO_URI || '';
  const dbName = process.env.MONGODB_DB || 'thewebvale';

  console.log(`Connecting to MongoDB URI... DB: ${dbName}`);
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection('filecraft_users');

  const { hash, salt } = await hashPassword('Secure@123');

  const targetEmail = 'yaashjainn@gmail.com';
  console.log(`\n=== Checking collection 'filecraft_users' in DB '${dbName}' ===`);

  const existingUsers = await collection.find({}).toArray();
  console.log(`Total users in ${dbName}.filecraft_users:`, existingUsers.length);
  for (const u of existingUsers) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`);
  }

  // Upsert user yaashjainn@gmail.com
  const user = await collection.findOne({
    $or: [
      { email: targetEmail.toLowerCase() },
      { email: { $regex: new RegExp('yaashjainn', 'i') } }
    ]
  });

  if (user) {
    console.log(`\nFound user: ${user.email} (ID: ${user.id}). Updating password to Secure@123...`);
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          email: targetEmail.toLowerCase(),
          passwordHash: hash,
          passwordSalt: salt,
          lastLoginAt: Date.now(),
        }
      }
    );
    console.log(`Successfully updated password for ${user.email}!`);
  } else {
    console.log(`\nUser ${targetEmail} not found in ${dbName}.filecraft_users. Inserting new record...`);
    const newUser = {
      id: 'user_yaashjainn_001',
      name: 'Yash Jain',
      email: targetEmail.toLowerCase(),
      role: 'admin',
      plan: 'pro',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      usage: {
        documentsCount: 0,
        aiQueriesUsed: 0,
        storageBytes: 0,
        maxStorageBytes: 10_000_000_000,
      },
      preferences: {
        defaultFont: 'Plus Jakarta Sans',
        theme: 'dark',
        autoSaveInterval: 1000,
      },
      passwordHash: hash,
      passwordSalt: salt,
    };
    await collection.insertOne(newUser as any);
    console.log(`Successfully created user ${targetEmail} with password Secure@123!`);
  }

  // Also verify that yash@thewebvale.com and any other alias has Secure@123 if needed
  const yashWebvale = await collection.findOne({ email: 'yash@thewebvale.com' });
  if (yashWebvale) {
    console.log(`Updating password for alias yash@thewebvale.com as well...`);
    await collection.updateOne(
      { _id: yashWebvale._id },
      {
        $set: {
          passwordHash: hash,
          passwordSalt: salt,
          lastLoginAt: Date.now(),
        }
      }
    );
  }

  // Also check default users setup in lib/auth/db.ts
  await client.close();
}

main().catch(console.error);
