'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { decryptSharePayload } from '@/lib/security/burn-share';
import { 
  Flame, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  HardDrive, 
  Calendar, 
  User, 
  ArrowRight,
  FileText,
  Sparkles,
  KeyRound
} from 'lucide-react';
import saveAs from 'file-saver';
import { DriveItem } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo } from '@/lib/drive/drive-helpers';
import { DriveMediaPlayer } from '@/components/drive/DriveMediaPlayer';
import { DriveSpreadsheetViewer } from '@/components/drive/DriveSpreadsheetViewer';
import { DriveArchiveViewer } from '@/components/drive/DriveArchiveViewer';
import { DriveCodeViewer } from '@/components/drive/DriveCodeViewer';

export default function ShareRecipientPage() {
  const params = useParams();
  const id = params?.id as string;

  // Mode: 'burn' (client-side encrypted single-view) or 'cloud_drive' (FileCraft public link)
  const [shareMode, setShareMode] = useState<'detecting' | 'burn' | 'cloud_drive'>('detecting');

  // Burn share state
  const [burnStatus, setBurnStatus] = useState<'loading' | 'ready' | 'burned' | 'error'>('loading');
  const [burnFileName, setBurnFileName] = useState('');
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [burnErrorMsg, setBurnErrorMsg] = useState('');

  // Cloud drive share state
  const [driveItem, setDriveItem] = useState<DriveItem | null>(null);
  const [cloudBlob, setCloudBlob] = useState<Blob | null>(null);
  const [cloudText, setCloudText] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // 1. Check if hash key exists (Burn-On-Read share)
    const hash = window.location.hash;
    if (hash && hash.includes('key=')) {
      setShareMode('burn');
      loadBurnPayload(hash);
    } else {
      // 2. Try FileCraft Cloud Drive public share first
      setShareMode('cloud_drive');
      loadCloudShare();
    }
  }, [id]);

  // Load Burn-on-Read Payload
  const loadBurnPayload = async (hash: string) => {
    try {
      const keyMatch = hash.match(/key=([^&]+)/);
      if (!keyMatch) {
        throw new Error('Encryption key missing from URL hash fragment.');
      }
      const keyBase64 = decodeURIComponent(keyMatch[1]);

      const res = await fetch(`/api/share?id=${id}`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) {
          setBurnStatus('burned');
          return;
        }
        throw new Error('Failed to fetch encrypted payload.');
      }

      const data = await res.json();
      setBurnFileName(data.name);

      const cipherBinary = atob(data.data);
      const cipherBytes = new Uint8Array(cipherBinary.length);
      for (let i = 0; i < cipherBinary.length; i++) {
        cipherBytes[i] = cipherBinary.charCodeAt(i);
      }

      const ivBinary = atob(data.iv);
      const ivBytes = new Uint8Array(ivBinary.length);
      for (let i = 0; i < ivBinary.length; i++) {
        ivBytes[i] = ivBinary.charCodeAt(i);
      }

      const decryptedBuffer = await decryptSharePayload(cipherBytes.buffer, ivBytes, keyBase64);
      const blob = new Blob([decryptedBuffer], { type: data.mimeType || 'application/octet-stream' });

      setDecryptedBlob(blob);
      setBurnStatus('ready');
    } catch (err: any) {
      setBurnErrorMsg(err.message);
      setBurnStatus('error');
    }
  };

  // Load Cloud Drive Public Share
  const loadCloudShare = async (pwd?: string) => {
    setCloudLoading(true);
    setPasswordError(null);
    try {
      let url = `/api/drive/share/public?id=${encodeURIComponent(id)}`;
      if (pwd) {
        url += `&password=${encodeURIComponent(pwd)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.passwordRequired) {
        setPasswordRequired(true);
        if (data.error) setPasswordError(data.error);
        setCloudLoading(false);
        return;
      }

      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Failed to load shared file');
      }

      setPasswordRequired(false);
      const item = data.item as DriveItem;
      setDriveItem(item);

      // Pre-fetch blob for interactive viewers if needed (spreadsheets, archives, code)
      const ext = (item.extension || '').toLowerCase();
      if (
        ['csv', 'xlsx', 'xls', 'tsv', 'zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ||
        item.category === 'code' ||
        ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'md', 'txt', 'sql', 'sh'].includes(ext)
      ) {
        try {
          const blobRes = await fetch(`/api/drive/file/${item.id}`);
          if (blobRes.ok) {
            const b = await blobRes.blob();
            setCloudBlob(b);
            if (item.category === 'code' || ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'md', 'txt', 'sql', 'sh'].includes(ext)) {
              const text = await b.text();
              setCloudText(text);
            }
          }
        } catch (e) {
          console.error('Failed to pre-fetch blob:', e);
        }
      }
    } catch (err: any) {
      setCloudError(err.message);
    } finally {
      setCloudLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPassword.trim()) return;
    loadCloudShare(enteredPassword.trim());
  };

  // ==========================================
  // RENDER: BURN-ON-READ SHARE
  // ==========================================
  if (shareMode === 'burn') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 py-16 font-sans">
        <div className="w-full max-w-lg mx-auto text-center">
          {burnStatus === 'loading' && (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <Flame className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Decrypting Secure Share...</h2>
              <p className="text-xs text-zinc-500">Decrypting payload in-browser via AES-256-GCM zero-knowledge key.</p>
            </div>
          )}

          {burnStatus === 'ready' && decryptedBlob && (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1.5">
                  {burnFileName}
                </h2>
                <p className="text-xs text-zinc-500">
                  Payload decrypted successfully. This link has now burned and cannot be accessed again.
                </p>
              </div>

              <button
                onClick={() => saveAs(decryptedBlob, burnFileName)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Intact File</span>
              </button>
            </div>
          )}

          {burnStatus === 'burned' && (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">This Share has Burned</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This file was already viewed or expired and has been permanently shredded from server memory.
              </p>
            </div>
          )}

          {burnStatus === 'error' && (
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Decryption Error</h2>
              <p className="text-xs text-zinc-500">{burnErrorMsg}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PASSWORD PROTECTION GATE
  // ==========================================
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 py-16 font-sans">
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1.5">
              Password Protected Document
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              The owner of this file has restricted access. Enter the security passphrase to view.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-rose-500">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={!enteredPassword.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOADING & ERROR STATES
  // ==========================================
  if (cloudLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <span className="w-8 h-8 rounded-full bg-rose-500 animate-ping" />
          <p className="text-xs font-bold text-zinc-400">Loading Shared Document...</p>
        </div>
      </div>
    );
  }

  if (cloudError || !driveItem) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 py-16 font-sans">
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">Document Unavailable</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {cloudError || 'This file may have been moved, deleted, or sharing permissions were updated.'}
          </p>
          <div className="pt-2">
            <a
              href="/drive"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <span>Go to FileCraft Cloud Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: FULL CLOUD DRIVE PREVIEW & DOWNLOAD
  // ==========================================
  const fileUrl = `/api/drive/file/${driveItem.id}`;
  const downloadUrl = `/api/drive/file/${driveItem.id}?download=1`;
  const ext = (driveItem.extension || '').toLowerCase();
  const allowDownload = driveItem.shareConfig?.allowDownload !== false;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-zinc-800/80 px-4 sm:px-8 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-base shrink-0 shadow-md">
            FC
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black truncate text-zinc-100">
              {driveItem.name}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>{formatBytes(driveItem.size)}</span>
              <span>•</span>
              <span>Shared by {driveItem.ownerName || 'FileCraft Team'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {allowDownload ? (
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download File</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">
              <Eye className="w-3.5 h-3.5" />
              <span>View Only</span>
            </div>
          )}

          <a
            href="/drive"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800/60 text-xs font-bold text-zinc-300 transition-colors"
          >
            <span>Open in Cloud Drive</span>
          </a>
        </div>
      </header>

      {/* Main Preview Viewport */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <div className="flex-1 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          {/* 1. Video & Audio Range Player */}
          {driveItem.category === 'media' || driveItem.mimeType?.startsWith('video/') || driveItem.mimeType?.startsWith('audio/') ? (
            <div className="flex-1 h-full min-h-[500px]">
              <DriveMediaPlayer
                src={fileUrl}
                type={driveItem.mimeType?.startsWith('video/') ? 'video' : 'audio'}
                name={driveItem.name}
              />
            </div>
          ) : /* 2. Spreadsheets (CSV/XLSX) */
          ['csv', 'xlsx', 'xls', 'tsv'].includes(ext) && cloudBlob ? (
            <div className="flex-1 h-full min-h-[600px]">
              <DriveSpreadsheetViewer
                blob={cloudBlob}
                fileName={driveItem.name}
              />
            </div>
          ) : /* 3. Archives (ZIP/TAR) */
          ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) && cloudBlob ? (
            <div className="flex-1 h-full min-h-[600px]">
              <DriveArchiveViewer
                blob={cloudBlob}
              />
            </div>
          ) : /* 4. Code & Text */
          [
            'js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 
            'md', 'txt', 'sql', 'sh', 'yaml', 'yml', 'env', 'go', 'rs', 'java', 'c', 'cpp'
          ].includes(ext) && cloudText !== null ? (
            <div className="flex-1 h-full min-h-[600px]">
              <DriveCodeViewer
                code={cloudText}
                language={driveItem.extension || 'plaintext'}
              />
            </div>
          ) : /* 5. High-Resolution Images */
          driveItem.category === 'image' ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={driveItem.name}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-zinc-800"
              />
            </div>
          ) : /* 6. PDF Embed */
          ext === 'pdf' ? (
            <iframe
              src={fileUrl}
              title={driveItem.name}
              className="w-full h-full min-h-[75vh] border-none rounded-2xl"
            />
          ) : (
            /* Fallback generic document card */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                <FileText className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-100 mb-1">{driveItem.name}</h3>
                <p className="text-xs text-zinc-400">
                  {formatBytes(driveItem.size)} • {driveItem.mimeType}
                </p>
              </div>
              {allowDownload && (
                <a
                  href={downloadUrl}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Meta & Branding */}
        <footer className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 px-2 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Powered by FileCraft Cloud Drive & WebAssembly Engine</span>
          </div>
          <div>
            <span>Updated {formatTimeAgo(driveItem.updatedAt)}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
