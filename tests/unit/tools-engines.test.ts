import assert from 'node:assert';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import crypto from 'node:crypto';

export async function runToolsEnginesTests() {
  console.log('🧪 Testing [FileCraft Specialized Tool Engines]...');

  // 1. PDF ENGINE: Create, Add Page, Rotate, and Serialize
  const pdfDoc = await PDFDocument.create();
  const page1 = pdfDoc.addPage([600, 400]);
  page1.drawText('FileCraft Engine Verification', {
    x: 50,
    y: 350,
    size: 20,
    color: rgb(0.9, 0.2, 0.3),
  });
  page1.setRotation(degrees(90));

  const page2 = pdfDoc.addPage([600, 400]);
  page2.drawText('Page 2 Content', { x: 50, y: 350, size: 16 });

  const pdfBytes = await pdfDoc.save();
  assert.ok(pdfBytes.length > 500, 'Generated PDF should be valid binary');

  // Load back and verify page count & rotation
  const loadedPdf = await PDFDocument.load(pdfBytes);
  assert.strictEqual(loadedPdf.getPageCount(), 2, 'PDF should have exactly 2 pages');
  assert.strictEqual(loadedPdf.getPage(0).getRotation().angle, 90, 'Page 1 should have 90 degree rotation');

  // 2. PDF SPLIT / PAGE EXTRACTION ENGINE
  const splitDoc = await PDFDocument.create();
  const [copiedPage] = await splitDoc.copyPages(loadedPdf, [1]);
  splitDoc.addPage(copiedPage);
  const splitBytes = await splitDoc.save();
  const reloadedSplit = await PDFDocument.load(splitBytes);
  assert.strictEqual(reloadedSplit.getPageCount(), 1, 'Split PDF should have 1 page');

  // 3. TABULAR / EXCEL & CSV ENGINE
  const worksheetData = [
    ['EmpID', 'Name', 'Salary', 'Department'],
    ['101', 'Yash Jain', 150000, 'Engineering'],
    ['102', 'Shreya Jain', 160000, 'Architecture'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  assert.ok(csvOutput.includes('Yash Jain,150000,Engineering'));

  const jsonOutput: any[] = XLSX.utils.sheet_to_json(ws);
  assert.strictEqual(jsonOutput.length, 2);
  assert.strictEqual(jsonOutput[0].Name, 'Yash Jain');
  assert.strictEqual(jsonOutput[0].Salary, 150000);

  // 4. ARCHIVE / JSZIP COMPRESSION ENGINE
  const zip = new JSZip();
  zip.file('invoice.txt', 'Invoice Total: $500.00');
  zip.file('docs/nested_report.md', '# Nested Report\nVerified by FileCraft');
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  assert.ok(zipBuffer.length > 100, 'ZIP buffer should be generated');

  const loadedZip = await JSZip.loadAsync(zipBuffer);
  const invoiceText = await loadedZip.file('invoice.txt')?.async('string');
  assert.strictEqual(invoiceText, 'Invoice Total: $500.00');
  assert.ok(loadedZip.file('docs/nested_report.md'), 'Nested path in ZIP must be preserved');

  // 5. HASH & CRYPTO VERIFICATION ENGINE
  const sampleData = Buffer.from('FileCraft Universal File OS 2026');
  const md5Hash = crypto.createHash('md5').update(sampleData).digest('hex');
  const sha256Hash = crypto.createHash('sha256').update(sampleData).digest('hex');
  assert.strictEqual(md5Hash.length, 32, 'MD5 should be 32 hex characters');
  assert.strictEqual(sha256Hash.length, 64, 'SHA-256 should be 64 hex characters');

  // 6. BASE64 & DATA URI ENGINE
  const rawString = 'Hello FileCraft World!';
  const base64Encoded = Buffer.from(rawString).toString('base64');
  const base64Decoded = Buffer.from(base64Encoded, 'base64').toString('utf8');
  assert.strictEqual(base64Decoded, rawString);

  console.log('  ✅ [FileCraft Specialized Tool Engines] passed all assertions.');
}
