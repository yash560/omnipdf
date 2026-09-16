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
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  const collection = db.collection('filecraft_users');

  console.log('Searching for users in filecraft_users...');
  const allUsers = await collection.find({}).toArray();
  console.log('Total users in DB:', allUsers.length);
  for (const u of allUsers) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  }

  const targetEmail = 'yaashjainn@gmail.com';
  const newPassword = 'Secure@123';

  // Find user with exact or partial email match
  let user = await collection.findOne({
    $or: [
      { email: targetEmail.toLowerCase() },
      { email: { $regex: new RegExp('yaashjainn', 'i') } },
      { id: { $regex: new RegExp('yaashjainn', 'i') } }
    ]
  });

  const { hash, salt } = await hashPassword(newPassword);

  if (user) {
    console.log(`\nFound existing user: ${user.email} (ID: ${user.id})`);
    const res = await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: hash,
          passwordSalt: salt,
          lastLoginAt: Date.now(),
        }
      }
    );
    console.log(`Updated password for ${user.email}. Modified count: ${res.modifiedCount}`);
  } else {
    console.log(`\nUser ${targetEmail} not found. Creating user record...`);
    const newUser = {
      id: `user_yaashjainn_${Date.now()}`,
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
    console.log(`Created new user ${targetEmail} with password ${newPassword}`);
  }

  // Also check if yash@thewebvale.com exists or if yaashjainn is used anywhere else
  await client.close();
}

main().catch(console.error);
