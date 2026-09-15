import { User } from '@/types/auth';
import { hashPassword } from './jwt';
import { getMongoDb } from '@/lib/db/mongodb';

export interface UserRecord extends User {
  passwordHash: string;
  passwordSalt: string;
}

const USERS_COLLECTION = 'filecraft_users';

// In-memory fallback / quick cache for serverless lifecycles
const memoryCache = new Map<string, UserRecord>();

let dbInitialized = false;

async function ensureDefaultUsers() {
  if (dbInitialized) return;
  dbInitialized = true;

  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);

    // Create unique index on email
    await collection.createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await collection.createIndex({ id: 1 }, { unique: true }).catch(() => {});

    // Check if Yash user exists
    const yashExists = await collection.findOne({ email: 'yash@thewebvale.com' });
    if (!yashExists) {
      const yashPass = await hashPassword('Password123!', 'salt_yash_omnipdf');
      const yashUser: UserRecord = {
        id: 'user_yash_vip_001',
        name: 'Yash Jain',
        email: 'yash@thewebvale.com',
        role: 'admin',
        plan: 'pro',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        lastLoginAt: Date.now(),
        usage: {
          documentsCount: 42,
          aiQueriesUsed: 128,
          storageBytes: 14_500_000,
          maxStorageBytes: 10_000_000_000, // 10 GB Pro
        },
        preferences: {
          defaultFont: 'Plus Jakarta Sans',
          theme: 'dark',
          autoSaveInterval: 1000,
        },
        passwordHash: yashPass.hash,
        passwordSalt: yashPass.salt,
      };
      await collection.insertOne(yashUser);
      memoryCache.set(yashUser.email.toLowerCase(), yashUser);
      memoryCache.set(yashUser.id, yashUser);
    }

    // Check if demo user exists
    const demoExists = await collection.findOne({ email: 'demo@omnipdf.app' });
    if (!demoExists) {
      const demoPass = await hashPassword('demo1234', 'salt_demo_omnipdf');
      const demoUser: UserRecord = {
        id: 'user_demo_002',
        name: 'Demo Architect',
        email: 'demo@omnipdf.app',
        role: 'user',
        plan: 'pro',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastLoginAt: Date.now(),
        usage: {
          documentsCount: 8,
          aiQueriesUsed: 24,
          storageBytes: 2_400_000,
          maxStorageBytes: 1_000_000_000,
        },
        preferences: {
          defaultFont: 'Plus Jakarta Sans',
          theme: 'dark',
          autoSaveInterval: 1500,
        },
        passwordHash: demoPass.hash,
        passwordSalt: demoPass.salt,
      };
      await collection.insertOne(demoUser);
      memoryCache.set(demoUser.email.toLowerCase(), demoUser);
      memoryCache.set(demoUser.id, demoUser);
    }
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB initialization fallback to memory:', err);
  }
}

// Safe user serializer (omits password hash and salt)
export function sanitizeUser(record: UserRecord): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, ...safeUser } = record;
  return safeUser;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase().trim();
  await ensureDefaultUsers();

  // Try MongoDB first
  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);
    const doc = await collection.findOne({ email: normalized });
    if (doc) {
      memoryCache.set(normalized, doc);
      memoryCache.set(doc.id, doc);
      return doc;
    }
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB query error:', err);
  }

  // Fallback to memory cache
  return memoryCache.get(normalized) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  await ensureDefaultUsers();

  // Try MongoDB first
  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);
    const doc = await collection.findOne({ id });
    if (doc) {
      memoryCache.set(doc.email.toLowerCase(), doc);
      memoryCache.set(id, doc);
      return doc;
    }
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB findUserById error:', err);
  }

  // Fallback to memory cache
  if (memoryCache.has(id)) {
    return memoryCache.get(id)!;
  }
  for (const user of memoryCache.values()) {
    if (user.id === id) return user;
  }
  return null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  plan?: 'free' | 'pro' | 'enterprise';
}): Promise<UserRecord> {
  await ensureDefaultUsers();
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if exists
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const { hash, salt } = await hashPassword(data.password);
  const newUser: UserRecord = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: normalizedEmail,
    role: 'user',
    plan: data.plan || 'pro', // Give all new signups free Pro Trial
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    usage: {
      documentsCount: 0,
      aiQueriesUsed: 0,
      storageBytes: 0,
      maxStorageBytes: 1_000_000_000,
    },
    preferences: {
      defaultFont: 'Plus Jakarta Sans',
      theme: 'system',
      autoSaveInterval: 1200,
    },
    passwordHash: hash,
    passwordSalt: salt,
  };

  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);
    await collection.insertOne(newUser);
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB insert error:', err);
  }

  memoryCache.set(normalizedEmail, newUser);
  memoryCache.set(newUser.id, newUser);
  return newUser;
}

export async function createGuestUser(): Promise<UserRecord> {
  await ensureDefaultUsers();
  const guestId = `guest_${Date.now().toString(36)}`;
  const guestUser: UserRecord = {
    id: `user_${guestId}`,
    name: `Guest User #${guestId.slice(-4)}`,
    email: `guest_${guestId}@filecraft.local`,
    role: 'user',
    plan: 'pro',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    usage: {
      documentsCount: 1,
      aiQueriesUsed: 10,
      storageBytes: 500_000,
      maxStorageBytes: 500_000_000,
    },
    preferences: {
      defaultFont: 'Plus Jakarta Sans',
      theme: 'system',
      autoSaveInterval: 1200,
    },
    passwordHash: 'guest_no_password',
    passwordSalt: 'guest_salt',
  };

  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);
    await collection.insertOne(guestUser);
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB insert guest error:', err);
  }

  memoryCache.set(guestUser.email.toLowerCase(), guestUser);
  memoryCache.set(guestUser.id, guestUser);
  return guestUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await findUserById(id);
  if (!user) return null;

  const updatedUser: UserRecord = {
    ...user,
    ...updates,
    lastLoginAt: Date.now(),
  };

  try {
    const db = await getMongoDb();
    const collection = db.collection<UserRecord>(USERS_COLLECTION);
    await collection.updateOne({ id }, { $set: updatedUser });
  } catch (err) {
    console.warn('[FileCraft Auth] MongoDB update error:', err);
  }

  memoryCache.set(updatedUser.email.toLowerCase(), updatedUser);
  memoryCache.set(id, updatedUser);
  return sanitizeUser(updatedUser);
}
