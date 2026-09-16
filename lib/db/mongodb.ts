import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

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

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = getMongoUri();
  if (!uri) {
    throw new Error('[FileCraft DB] Missing MONGODB_URI environment variable.');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  cachedClient = client;
  return client;
}

export async function getMongoDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient();
  const db = client.db(getDbName());
  cachedDb = db;
  return db;
}
