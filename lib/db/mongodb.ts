import { MongoClient, Db } from 'mongodb';

const MONGO_URI = 
  process.env.MONGODB_URI || 
  process.env.MONGO_URI || 
  process.env.THEWEBVALE_MONGO_URI || 
  'mongodb+srv://yaashjainn:2CfKwxYEOFqjowmn@webverse.5exbv3u.mongodb.net/?retryWrites=true&w=majority';

const DB_NAME = process.env.MONGODB_DB || 'thewebvale';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGO_URI, {
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
  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}
