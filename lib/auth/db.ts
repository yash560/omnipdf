import { User } from '@/types/auth';
import { hashPassword } from './jwt';

interface UserRecord extends User {
  passwordHash: string;
  passwordSalt: string;
}

// Global user repository cache across serverless runs
const globalUsers = new Map<string, UserRecord>();

// Initialize default VIP accounts
let initialized = false;

async function initDefaultUsers() {
  if (initialized) return;
  initialized = true;

  // 1. Yash Jain (Pro Admin Account)
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
      maxStorageBytes: 1_000_000_000, // 1 GB Pro
    },
    preferences: {
      defaultFont: 'Plus Jakarta Sans',
      theme: 'dark',
      autoSaveInterval: 1000,
    },
    passwordHash: yashPass.hash,
    passwordSalt: yashPass.salt,
  };
  globalUsers.set(yashUser.email.toLowerCase(), yashUser);

  // 2. Demo Pro Account
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
      maxStorageBytes: 500_000_000,
    },
    preferences: {
      defaultFont: 'Inter',
      theme: 'dark',
      autoSaveInterval: 1500,
    },
    passwordHash: demoPass.hash,
    passwordSalt: demoPass.salt,
  };
  globalUsers.set(demoUser.email.toLowerCase(), demoUser);
}

// Safe user serializer (omits password hash and salt)
export function sanitizeUser(record: UserRecord): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, ...safeUser } = record;
  return safeUser;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await initDefaultUsers();
  return globalUsers.get(email.toLowerCase().trim()) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  await initDefaultUsers();
  for (const user of globalUsers.values()) {
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
  await initDefaultUsers();
  const normalizedEmail = data.email.toLowerCase().trim();

  if (globalUsers.has(normalizedEmail)) {
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
      maxStorageBytes: 500_000_000,
    },
    preferences: {
      defaultFont: 'Plus Jakarta Sans',
      theme: 'system',
      autoSaveInterval: 1200,
    },
    passwordHash: hash,
    passwordSalt: salt,
  };

  globalUsers.set(normalizedEmail, newUser);
  return newUser;
}

export async function createGuestUser(): Promise<UserRecord> {
  await initDefaultUsers();
  const guestId = `guest_${Date.now().toString(36)}`;
  const guestUser: UserRecord = {
    id: `user_${guestId}`,
    name: `Guest User #${guestId.slice(-4)}`,
    email: `guest_${guestId}@omnipdf.local`,
    role: 'user',
    plan: 'pro',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    usage: {
      documentsCount: 1,
      aiQueriesUsed: 5,
      storageBytes: 500_000,
      maxStorageBytes: 100_000_000,
    },
    passwordHash: 'guest_no_password',
    passwordSalt: 'guest_salt',
  };

  globalUsers.set(guestUser.email.toLowerCase(), guestUser);
  return guestUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await findUserById(id);
  if (!user) return null;

  Object.assign(user, updates);
  globalUsers.set(user.email.toLowerCase(), user);
  return sanitizeUser(user);
}
