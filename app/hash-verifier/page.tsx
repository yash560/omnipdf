'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { computeHashes, HashReport } from '@/lib/security/hash-engine';
import { Hash, Copy, CheckCircle2, XCircle, Sliders, Sparkles } from 'lucide-react';
import { formatBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function HashVerifierPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [hashes, setHashes] = useState<HashReport | null>(null);
  const [expectedHash, setExpectedHash] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const res = await computeHashes(newFiles[0].file);
        setHashes(res);
      } catch (err: any) {
        alert(`Hash computation failed: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setHashes(null);
    }
  };

  const copyHash = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cleanExpected = expectedHash.trim().toLowerCase();
  const isMatch = hashes
    ? cleanExpected.length > 0 &&
      (hashes.sha256.toLowerCase() === cleanExpected ||
        hashes.sha512.toLowerCase() === cleanExpected ||
        hashes.sha384.toLowerCase() === cleanExpected ||
        hashes.sha1.toLowerCase() === cleanExpected ||
        hashes.crc32.toLowerCase() === cleanExpected)
    : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 text-lime-700 dark:text-lime-400 text-xs font-bold mb-3">
          <Hash className="w-3.5 h-3.5" />
          <span>Cryptographic Hash & Checksum Verifier</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Verify File Checksums & Integrity
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Calculate SHA-256, SHA-512, SHA-384, SHA-1, and CRC32 in seconds using hardware-accelerated Web Crypto.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="*/*"
          multiple={false}
          title="Select or Drop Any File"
          subtitle="Computes all cryptographic hashes client-side"
          primaryColor="#84cc16"
        />
      </div>

      {hashes && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Comparison Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Verify Against Expected Checksum:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Paste expected SHA-256 / SHA-512 / MD5 hash..."
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none"
              />
              {cleanExpected.length > 0 && (
                <div
                  className={`px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold ${
                    isMatch
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {isMatch ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{isMatch ? 'Hash Verified & Match!' : 'Hash Mismatch!'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hashes List */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'SHA-256 (Standard)', val: hashes.sha256, key: 'sha256' },
              { label: 'SHA-512 (High Security)', val: hashes.sha512, key: 'sha512' },
              { label: 'SHA-384', val: hashes.sha384, key: 'sha384' },
              { label: 'SHA-1 (Legacy)', val: hashes.sha1, key: 'sha1' },
              { label: 'CRC32 (Checksum)', val: hashes.crc32, key: 'crc32' },
            ].map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 break-all">{item.val}</div>
                </div>
                <button
                  onClick={() => copyHash(item.val, item.key)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedKey === item.key ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* AI Assistant Banner */}
          <ToolAIAssistantBanner
            suite="security"
            toolSlug="hash-verifier"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={hashes ? `File: ${files[0]?.file.name} (${formatBytes(files[0]?.file.size)})\nSHA-256: ${hashes.sha256}\nSHA-512: ${hashes.sha512}\nSHA-1: ${hashes.sha1}\nCRC32: ${hashes.crc32}` : undefined}
          />
        </div>
      )}
    </div>
  );
}
