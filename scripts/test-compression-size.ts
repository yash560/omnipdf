import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function scanDir(dir: string): string[] {
  let files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDir(full));
    } else if (!entry.name.startsWith('.')) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const allFiles = scanDir('/Users/yash/Downloads/Important documents');
  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const filePath of allFiles) {
    const stat = fs.statSync(filePath);
    originalTotal += stat.size;
    const ext = path.extname(filePath).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      try {
        const buffer = fs.readFileSync(filePath);
        const optimized = await sharp(buffer)
          .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 78, progressive: true, mozjpeg: true })
          .toBuffer();
        optimizedTotal += Math.min(optimized.length, stat.size);
      } catch (e) {
        optimizedTotal += stat.size;
      }
    } else {
      optimizedTotal += stat.size;
    }
  }

  console.log(`Original Total: ${(originalTotal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Optimized Total: ${(optimizedTotal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Storage Savings: ${((1 - optimizedTotal / originalTotal) * 100).toFixed(1)}%`);
}

main().catch(console.error);
