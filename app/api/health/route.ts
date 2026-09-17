import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';

export async function GET() {
  const uri = process.env.MONGODB_URI || 'MISSING';
  const db_name = process.env.MONGODB_DB || 'MISSING';
  let dbStatus = 'unknown';
  let userCount = 0;
  try {
    const db = await getMongoDb();
    userCount = await db.collection('filecraft_users').countDocuments({ email: 'yaashjainn@gmail.com' });
    dbStatus = 'connected';
  } catch (e: any) {
    dbStatus = 'error: ' + (e?.message || '').substring(0, 100);
  }
  return NextResponse.json({ uri_prefix: uri.substring(0, 40) + '...', db: db_name, dbStatus, yaashjainn_exists: userCount > 0 });
}
