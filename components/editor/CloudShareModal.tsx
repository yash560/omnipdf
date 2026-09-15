'use client';

import { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Lock, 
  Download, 
  ShieldCheck, 
  EyeOff, 
  Key, 
  Printer, 
  Clock, 
  Flame, 
  ExternalLink,
  MessageCircle,
  FileCheck2,
  Code
} from 'lucide-react';
import { StudioSession } from '@/types/session';
import { SharePermissions, EncryptedSharePackage, OpenSecurityAuditInfo } from '@/types/share';
import { 
  arrayBufferToBase64, 
  encryptSharePayload, 
  generateOpenSecurityAudit 
} from '@/lib/crypto/secure-share';
import { saveClientSharedPackage } from '@/lib/storage/cloud-share-db';
import { OpenSecurityInspector } from '@/components/share/OpenSecurityInspector';

interface CloudShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudioSession | null;
}

export function CloudShareModal({
  isOpen,
  onClose,
  session,
}: CloudShareModalProps) {
  // Config state
  const [encryptMode, setEncryptMode] = useState<'fragment' | 'passcode'>('fragment');
  const [passcode, setPasscode] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowAnnotate, setAllowAnnotate] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [expiryOption, setExpiryOption] = useState<'1h' | '24h' | '7d' | '30d' | 'never'>('24h');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL SHARE');
  const [enableWatermark, setEnableWatermark] = useState(false);

  // Sharing output state
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [encryptedPackage, setEncryptedPackage] = useState<EncryptedSharePackage | null>(null);
  const [auditInfo, setAuditInfo] = useState<OpenSecurityAuditInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  if (!isOpen || !session) return null;

  const calculateExpiryTimestamp = (): number | null => {
    const now = Date.now();
    switch (expiryOption) {
      case '1h': return now + 60 * 60 * 1000;
      case '24h': return now + 24 * 60 * 60 * 1000;
      case '7d': return now + 7 * 24 * 60 * 60 * 1000;
      case '30d': return now + 30 * 24 * 60 * 60 * 1000;
      case 'never': return null;
    }
  };

  const handleGenerateShareLink = async () => {
    if (encryptMode === 'passcode' && !passcode.trim()) {
      alert('Please enter a passcode or switch to Zero-Knowledge URL Link mode.');
      return;
    }

    setIsEncrypting(true);

    try {
      const permissions: SharePermissions = {
        allowDownload,
        allowPrint,
        allowAnnotate,
        requirePasscode: encryptMode === 'passcode',
        watermarkText: enableWatermark ? watermarkText.trim() : undefined,
        burnAfterRead,
        expiresAt: calculateExpiryTimestamp(),
        maxViews: burnAfterRead ? 1 : null,
      };

      const pdfBase64 = arrayBufferToBase64(session.pdfData);

      const payload = {
        filename: session.filename,
        pdfBase64,
        annotations: session.annotations,
        pageViewports: session.pageViewports,
        createdAt: session.createdAt,
        exportedAt: Date.now(),
      };

      const metadata = {
        filename: session.filename,
        fileSize: session.size,
        pageCount: session.pageCount,
      };

      const isPasscode = encryptMode === 'passcode';
      const secret = isPasscode ? passcode.trim() : '';

      // Perform 100% Client-Side WebCrypto AES-256-GCM Encryption
      const { package: pkg, urlKeyFragment } = await encryptSharePayload(
        payload,
        secret,
        isPasscode,
        permissions,
        metadata
      );

      // Save encrypted package locally to client IndexedDB for immediate offline access
      await saveClientSharedPackage(pkg);

      // Also send encrypted package to cloud API (server never sees key or unencrypted payload)
      try {
        await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pkg),
        });
      } catch (e) {
        console.warn('API cloud sync error, fallback to client IndexedDB store:', e);
      }

      // Generate verifiable URL
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      let fullUrl = `${origin}/share/${pkg.id}`;
      if (urlKeyFragment) {
        fullUrl += `#key=${encodeURIComponent(urlKeyFragment)}`;
      }

      setGeneratedLink(fullUrl);
      setEncryptedPackage(pkg);

      // Prepare Open Security Audit Info
      const audit = generateOpenSecurityAudit(
        pkg,
        isPasscode ? secret : (urlKeyFragment || ''),
        isPasscode
      );
      setAuditInfo(audit);
    } catch (err: any) {
      console.error('Failed to generate encrypted share:', err);
      alert(`Encryption Error: ${err.message || 'Failed to encrypt document.'}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!generatedLink) return;
    const text = `🔒 Secure Encrypted PDF Document: ${session.filename}\n${generatedLink}${
      encryptMode === 'passcode' ? `\n🔑 Passcode: ${passcode}` : ''
    }`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadSnapshot = () => {
    const data = {
      sessionId: session.id,
      filename: session.filename,
      annotations: session.annotations,
      createdAt: session.createdAt,
      lastModified: session.lastModified,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.filename.replace(/\.pdf$/i, '')}_workspace.omnipdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Share2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Encrypted Cloud Share</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase">
                    AES-256-GCM
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Zero-Knowledge client encryption with granular download permissions
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="my-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
            {/* If Link is already generated */}
            {generatedLink ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>Secure Encrypted Link Ready</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Your PDF was encrypted in memory using <strong>AES-256-GCM</strong>. Only holders of this link can decrypt and view the document.
                  </p>
                </div>

                {/* Generated URL Box */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Shareable Zero-Knowledge Link
                  </label>
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 bg-transparent outline-none font-mono truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Test in New Tab</span>
                  </a>
                </div>

                {/* Passcode Reminder if set */}
                {encryptMode === 'passcode' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-mono text-[11px] flex items-center justify-between">
                    <span>Required Passcode: <strong>{passcode}</strong></span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(passcode);
                        alert('Passcode copied to clipboard');
                      }}
                      className="text-amber-700 dark:text-amber-400 underline font-bold cursor-pointer"
                    >
                      Copy PIN
                    </button>
                  </div>
                )}

                {/* Open Security Inspector Button */}
                {auditInfo && (
                  <div className="pt-2">
                    <button
                      onClick={() => setInspectorOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Code className="w-4 h-4" />
                      <span>Inspect Open Security Proof & Code</span>
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setGeneratedLink(null);
                      setEncryptedPackage(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                  >
                    ← Configure different permissions or re-encrypt
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration View */
              <div className="space-y-4">
                {/* 1. Encryption Mode */}
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    1. Encryption & Decryption Key Protocol
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEncryptMode('fragment')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        encryptMode === 'fragment'
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Key className="w-3.5 h-3.5 text-purple-500" />
                        <span>Zero-Knowledge URL</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight">
                        Key stored in URL fragment (#key=...). 1-click open, zero server exposure.
                      </div>
                    </button>

                    <button
                      onClick={() => setEncryptMode('passcode')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        encryptMode === 'passcode'
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Lock className="w-3.5 h-3.5 text-purple-500" />
                        <span>PIN / Passcode Locked</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight">
                        Recipient must enter your secret passcode to derive key via PBKDF2.
                      </div>
                    </button>
                  </div>

                  {encryptMode === 'passcode' && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        placeholder="Enter secret passcode or PIN (e.g. 849201 or MySecretPass)"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Download & Access Permissions */}
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    2. Recipient Permissions & Access Controls
                  </label>
                  <div className="space-y-2">
                    {/* Allow Download */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-zinc-500" />
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            Allow PDF Download
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {allowDownload ? 'Recipient can export & save PDF' : 'Download disabled (View-Only Mode)'}
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={(e) => setAllowDownload(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                      />
                    </div>

                    {/* Allow Print */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <Printer className="w-4 h-4 text-zinc-500" />
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            Allow Printing
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {allowPrint ? 'Recipient can print physical copies' : 'Print action blocked via security mask'}
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowPrint}
                        onChange={(e) => setAllowPrint(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                      />
                    </div>

                    {/* Burn after read */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            Burn After Reading (1-Time View)
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Link becomes permanently invalid after the first recipient opens it
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={burnAfterRead}
                        onChange={(e) => setBurnAfterRead(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Expiration & Watermarking */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Expiration Timer
                    </label>
                    <select
                      value={expiryOption}
                      onChange={(e) => setExpiryOption(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
                    >
                      <option value="1h">Expires in 1 Hour</option>
                      <option value="24h">Expires in 24 Hours</option>
                      <option value="7d">Expires in 7 Days</option>
                      <option value="30d">Expires in 30 Days</option>
                      <option value="never">Never Expires (Perpetual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confidential Watermark
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. CONFIDENTIAL"
                        value={watermarkText}
                        onChange={(e) => {
                          setWatermarkText(e.target.value);
                          setEnableWatermark(true);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Encrypt & Generate CTA */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isEncrypting}
                    className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isEncrypting ? 'Encrypting with Web Crypto...' : 'Encrypt & Generate Secure Cloud Link'}</span>
                  </button>
                </div>

                {/* Offline Snapshot Alternative */}
                <div className="pt-1">
                  <button
                    onClick={handleDownloadSnapshot}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Or export portable offline workspace (.omnipdf)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[11px] text-zinc-400">
            <span>Client AES-GCM 256 • Open Security</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Open Security Modal */}
      {auditInfo && (
        <OpenSecurityInspector
          audit={auditInfo}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </>
  );
}
