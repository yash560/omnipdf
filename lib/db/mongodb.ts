import { MongoClient, Db } from 'mongodb';

function getMongoUri(): string {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.THEWEBVALE_MONGO_URI ||
    ''
  );
}

function getDbName(): string {
  return process.env.MONGODB_DB || 'thewebvale';
}

interface MongoGlobalCache {
  conn: MongoClient | null;
  promise: Promise<MongoClient> | null;
  db: Db | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoGlobalCache: MongoGlobalCache | undefined;
}

function getCache(): MongoGlobalCache {
  if (!global.__mongoGlobalCache) {
    global.__mongoGlobalCache = { conn: null, promise: null, db: null };
  }
  return global.__mongoGlobalCache;
}

export async function getMongoClient(): Promise<MongoClient> {
  const cache = getCache();
  if (cache.conn) {
    return cache.conn;
  }

  const uri = getMongoUri();
  if (!uri) {
    throw new Error('[FileCraft DB] Missing MONGODB_URI environment variable.');
  }

  if (!cache.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 30000,
      retryWrites: true,
    });
    cache.promise = client.connect().then((c) => {
      cache.conn = c;
      return c;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}

export async function getMongoDb(): Promise<Db> {
  const cache = getCache();
  if (cache.db && cache.conn) {
    return cache.db;
  }

  const client = await getMongoClient();
  cache.db = client.db(getDbName());
  return cache.db;
}

