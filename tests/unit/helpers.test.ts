import assert from 'node:assert';
import { categorizeFile, formatBytes, formatTimeAgo, getFileCraftToolsForItem } from '../../lib/drive/drive-helpers';
import { DriveItem } from '../../lib/drive/drive-types';

export async function runHelpersTests() {
  console.log('🧪 Testing [drive-helpers.ts]...');

  // 1. File Categorization Tests
  assert.strictEqual(categorizeFile('document.pdf'), 'pdf');
  assert.strictEqual(categorizeFile('scan', 'application/pdf'), 'pdf');
  assert.strictEqual(categorizeFile('photo.jpg'), 'image');
  assert.strictEqual(categorizeFile('image.png'), 'image');
  assert.strictEqual(categorizeFile('icon.webp'), 'image');
  assert.strictEqual(categorizeFile('sheet.xlsx'), 'spreadsheet');
  assert.strictEqual(categorizeFile('data.csv'), 'spreadsheet');
  assert.strictEqual(categorizeFile('table.tsv'), 'spreadsheet');
  assert.strictEqual(categorizeFile('song.mp3'), 'media');
  assert.strictEqual(categorizeFile('movie.mp4'), 'media');
  assert.strictEqual(categorizeFile('audio.wav'), 'media');
  assert.strictEqual(categorizeFile('report.docx'), 'document');
  assert.strictEqual(categorizeFile('notes.txt'), 'document');
  assert.strictEqual(categorizeFile('book.epub'), 'document');
  assert.strictEqual(categorizeFile('bundle.zip'), 'archive');
  assert.strictEqual(categorizeFile('tarball.tar.gz'), 'archive');
  assert.strictEqual(categorizeFile('code.ts'), 'code');
  assert.strictEqual(categorizeFile('script.py'), 'code');
  assert.strictEqual(categorizeFile('styles.css'), 'code');
  assert.strictEqual(categorizeFile('unknown.xyz123'), 'other');

  // 2. formatBytes Tests
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(1024), '1 KB');
  assert.strictEqual(formatBytes(1536), '1.5 KB');
  assert.strictEqual(formatBytes(1048576), '1 MB');
  assert.strictEqual(formatBytes(1073741824), '1 GB');
  assert.strictEqual(formatBytes(5368709120), '5 GB');

  // 3. formatTimeAgo Tests
  const now = Date.now();
  assert.strictEqual(formatTimeAgo(now - 10000), 'Just now');
  assert.strictEqual(formatTimeAgo(now - 120000), '2m ago');
  assert.strictEqual(formatTimeAgo(now - 3600000 * 3), '3h ago');
  assert.strictEqual(formatTimeAgo(now - 86400000 * 2), '2d ago');

  // 4. getFileCraftToolsForItem Tests
  const folderItem = {
    id: 'f1',
    name: 'Tax Records',
    type: 'folder',
    size: 0,
    createdAt: now,
    updatedAt: now,
    isStarred: false,
    isTrash: false,
  } as unknown as DriveItem;
  const folderTools = getFileCraftToolsForItem(folderItem);
  assert.ok(folderTools.length >= 1, 'Folder should have at least 1 tool (ZIP)');
  assert.ok(folderTools.some((t) => t.label.includes('ZIP')));

  const pdfItem = {
    id: 'p1',
    name: 'Invoice.pdf',
    type: 'file',
    category: 'pdf',
    size: 1024 * 50,
    createdAt: now,
    updatedAt: now,
    isStarred: false,
    isTrash: false,
  } as unknown as DriveItem;
  const pdfTools = getFileCraftToolsForItem(pdfItem);
  assert.ok(pdfTools.length >= 5, 'PDF should have rich toolset (Editor, Compress, Split, Sign, OCR)');
  assert.ok(pdfTools.some((t) => t.href.includes('/edit?driveId=p1')));
  assert.ok(pdfTools.some((t) => t.href.includes('/compress?driveId=p1')));

  const imgItem = {
    id: 'i1',
    name: 'Avatar.png',
    type: 'file',
    category: 'image',
    size: 1024 * 500,
    createdAt: now,
    updatedAt: now,
    isStarred: false,
    isTrash: false,
  } as unknown as DriveItem;
  const imgTools = getFileCraftToolsForItem(imgItem);
  assert.ok(imgTools.some((t) => t.href.includes('/bg-remover')));
  assert.ok(imgTools.some((t) => t.href.includes('/image-compress')));

  console.log('  ✅ [drive-helpers.ts] passed all assertions.');
}
