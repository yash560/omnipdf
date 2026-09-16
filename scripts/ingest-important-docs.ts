import fs from 'fs';
import path from 'path';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import sharp from 'sharp';
import { categorizeFile } from '../lib/drive/drive-helpers';
import { getHeuristicLabels } from '../lib/ai/auto-labeler';
import { DriveItem } from '../lib/drive/drive-types';

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

loadEnv();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://yaashjainn:2CfKwxYEOFqjowmn@webverse.5exbv3u.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.MONGODB_DB || 'thewebvale';
const TARGET_EMAIL = 'yaashjainn@gmail.com';
const SOURCE_DIR = '/Users/yash/Downloads/Important documents';

const ITEMS_COLLECTION = 'filecraft_drive_items';
const USERS_COLLECTION = 'filecraft_users';
const BUCKET_NAME = 'filecraft_drive_storage';

function generateId(prefix: string = 'fc'): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  txt: 'text/plain',
  eml: 'message/rfc822',
  zip: 'application/zip',
  json: 'application/json',
  html: 'text/html',
};

async function optimizeBufferIfNeeded(buffer: Buffer, ext: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const imageExts = ['jpg', 'jpeg', 'png', 'webp'];
  if (imageExts.includes(ext.toLowerCase())) {
    try {
      const optimized = await sharp(buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer();
      if (optimized.length < buffer.length) {
        return { buffer: optimized, mimeType: 'image/jpeg' };
      }
    } catch {
      // Fallback
    }
  }
  return { buffer, mimeType: MIME_MAP[ext] || 'application/octet-stream' };
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Ingestion of "Important documents" for ${TARGET_EMAIL}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log(' Connected to MongoDB Atlas (database: thewebvale)');

  const db = client.db(DB_NAME);
  const usersCol = db.collection(USERS_COLLECTION);
  const itemsCol = db.collection<DriveItem>(ITEMS_COLLECTION);
  const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

  // 1. Find or create user
  let user: any = await usersCol.findOne({ email: TARGET_EMAIL.toLowerCase() });
  if (!user) {
    console.log(`👤 Creating user record for ${TARGET_EMAIL}...`);
    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      name: 'Yash Jain',
      email: TARGET_EMAIL.toLowerCase(),
      role: 'admin',
      plan: 'enterprise',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      usage: {
        documentsCount: 0,
        aiQueriesUsed: 0,
        storageBytes: 0,
        maxStorageBytes: 100_000_000_000,
      },
      preferences: {
        defaultFont: 'Plus Jakarta Sans',
        theme: 'dark',
        autoSaveInterval: 1000,
      },
    };
    await usersCol.insertOne(newUser as any);
    user = newUser;
  }

  const userId: string = user.id;
  const userEmail: string = user.email || TARGET_EMAIL;
  const userName: string = user.name || 'Yash Jain';
  console.log(`👤 User verified: ${userName} (${userEmail}, ID: ${userId}, Plan: ${user.plan})`);

  // 2. Clean up previous partial items & GridFS storage for a pristine fresh load
  console.log(`🧹 Cleaning up previous partial ingestion files...`);
  await itemsCol.deleteMany({ userId });
  await db.collection(`${BUCKET_NAME}.chunks`).deleteMany({});
  await db.collection(`${BUCKET_NAME}.files`).deleteMany({});
  console.log(` Cleaned GridFS chunks and drive items.`);

  // 3. Discover all directories and files
  const folderMap = new Map<string, string>(); // relativePath -> folderId
  const allFiles: { fullPath: string; relPath: string; fileName: string; dirRelPath: string }[] = [];

  function crawl(currentDir: string, relPath: string = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue;

      const fullPath = path.join(currentDir, entry.name);
      const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        crawl(fullPath, entryRelPath);
      } else if (entry.isFile()) {
        allFiles.push({
          fullPath,
          relPath: entryRelPath,
          fileName: entry.name,
          dirRelPath: relPath,
        });
      }
    }
  }

  console.log(`🔍 Scanning directory structure at ${SOURCE_DIR}...`);
  crawl(SOURCE_DIR);
  console.log(` Found ${allFiles.length} files to ingest!\n`);

  // 4. Create Root Folder "Important documents"
  const rootId = generateId('fld');
  const rootFolder: DriveItem = {
    id: rootId,
    name: 'Important documents',
    parentId: null,
    type: 'folder',
    mimeType: 'application/x-directory',
    size: 0,
    extension: '',
    category: 'other',
    color: 'rose',
    tags: ['Important', 'Documents', 'Vault', 'Personal', 'Yash'],
    aiSummary: 'Master Personal & Family Important Documents Vault.',
    aiCategory: 'Personal & Family',
    isAutoLabeled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
    isStarred: true,
    isTrash: false,
    userId,
    ownerEmail: userEmail,
    ownerName: userName,
    sharedWith: [],
  };
  await itemsCol.insertOne(rootFolder as any);
  console.log(` Created master root folder "Important documents" (ID: ${rootId})`);
  folderMap.set('', rootFolder.id);

  // 5. Create all intermediate subdirectories
  const uniqueDirs = new Set<string>();
  for (const f of allFiles) {
    if (f.dirRelPath) {
      const parts = f.dirRelPath.split('/');
      let accumulated = '';
      for (const p of parts) {
        accumulated = accumulated ? `${accumulated}/${p}` : p;
        uniqueDirs.add(accumulated);
      }
    }
  }

  const sortedDirs = Array.from(uniqueDirs).sort((a, b) => a.split('/').length - b.split('/').length);

  for (const dirPath of sortedDirs) {
    const parts = dirPath.split('/');
    const dirName = parts[parts.length - 1];
    const parentRel = parts.slice(0, -1).join('/');
    const parentId = folderMap.get(parentRel) || rootFolder.id;

    const folderId = generateId('fld');
    const folderItem: DriveItem = {
      id: folderId,
      name: dirName,
      parentId,
      relativePath: `Important documents/${dirPath}`,
      type: 'folder',
      mimeType: 'application/x-directory',
      size: 0,
      extension: '',
      category: 'other',
      color: dirName.toLowerCase().includes('people') || dirName.toLowerCase().includes('yash') ? 'blue' :
             dirName.toLowerCase().includes('vehicle') ? 'amber' :
             dirName.toLowerCase().includes('work') || dirName.toLowerCase().includes('salary') ? 'emerald' :
             dirName.toLowerCase().includes('cards') || dirName.toLowerCase().includes('bank') ? 'indigo' : 'default',
      tags: [dirName, 'Folder'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      isStarred: false,
      isTrash: false,
      userId,
      ownerEmail: userEmail,
      ownerName: userName,
      sharedWith: [],
    };
    await itemsCol.insertOne(folderItem as any);
    folderMap.set(dirPath, folderId);
    console.log(` 📁 Created folder: Important documents/${dirPath}`);
  }

  console.log(`\n Total folders created: ${folderMap.size}\n`);

  // 6. Ingest and AI Auto-Label each file
  let successCount = 0;
  let totalBytesUploaded = 0;

  for (let idx = 0; idx < allFiles.length; idx++) {
    const f = allFiles[idx];
    const parentId = folderMap.get(f.dirRelPath) || rootFolder.id;
    const ext = f.fileName.includes('.') ? f.fileName.split('.').pop()!.toLowerCase() : '';
    const stat = fs.statSync(f.fullPath);
    const rawBuffer = fs.readFileSync(f.fullPath);

    // Optimize image buffer
    const { buffer: fileBuffer, mimeType } = await optimizeBufferIfNeeded(rawBuffer, ext);
    const category = categorizeFile(f.fileName, mimeType);

    const fileId = generateId('fl');
    const fullRelativePath = `Important documents/${f.relPath}`;

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(fileId, {
      metadata: {
        userId,
        originalName: f.fileName,
        size: fileBuffer.length,
        originalSize: stat.size,
        mimeType,
        relativePath: fullRelativePath,
        createdAt: Date.now(),
      },
    });

    uploadStream.end(fileBuffer);
    await new Promise<void>((resolve, reject) => {
      uploadStream.on('finish', () => resolve());
      uploadStream.on('error', (err) => reject(err));
    });

    // Generate AI Auto-Labels
    const labelMeta = {
      fileName: f.fileName,
      relativePath: fullRelativePath,
      category,
      mimeType,
      size: stat.size,
    };

    const labels = getHeuristicLabels(labelMeta);

    const driveItem: DriveItem = {
      id: fileId,
      name: f.fileName,
      parentId,
      relativePath: fullRelativePath,
      type: 'file',
      mimeType,
      size: fileBuffer.length,
      extension: ext,
      category,
      tags: labels.tags,
      aiSummary: labels.aiSummary,
      aiCategory: labels.aiCategory,
      semanticKeywords: labels.semanticKeywords,
      isAutoLabeled: true,
      createdAt: stat.birthtimeMs || Date.now(),
      updatedAt: stat.mtimeMs || Date.now(),
      lastAccessedAt: Date.now(),
      isStarred: f.fileName.toLowerCase().includes('aadhaar') || f.fileName.toLowerCase().includes('resume') || f.fileName.toLowerCase().includes('offer'),
      isTrash: false,
      userId,
      ownerEmail: userEmail,
      ownerName: userName,
      sharedWith: [],
    };

    await itemsCol.insertOne(driveItem as any);

    successCount++;
    totalBytesUploaded += fileBuffer.length;

    const progressPct = Math.round(((idx + 1) / allFiles.length) * 100);
    const sizeDisplay = (fileBuffer.length / 1024).toFixed(1) + ' KB';
    const savedStr = fileBuffer.length < stat.size ? ` (saved ${Math.round((1 - fileBuffer.length / stat.size) * 100)}%)` : '';
    console.log(`[${idx + 1}/${allFiles.length}] (${progressPct}%) Ingested: ${f.fileName} [${sizeDisplay}${savedStr}] -> Tags: [${labels.tags.join(', ')}]`);
  }

  // 7. Update user storage usage
  await usersCol.updateOne(
    { id: userId },
    {
      $set: {
        'usage.documentsCount': successCount,
        'usage.storageBytes': totalBytesUploaded,
        updatedAt: Date.now(),
      },
    }
  );

  console.log(`\n======================================================`);
  console.log(` Ingestion Complete!`);
  console.log(` Total Files Ingested: ${successCount}`);
  console.log(` Total Data Stored: ${(totalBytesUploaded / (1024 * 1024)).toFixed(2)} MB`);
  console.log(` Master Vault User: ${TARGET_EMAIL} (${userId})`);
  console.log(`======================================================\n`);

  await client.close();
}

main().catch((err) => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
