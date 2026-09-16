'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { encryptFileForShare } from '@/lib/security/burn-share';
import { Flame, Copy, CheckCircle2, ShieldCheck, Lock, Link as LinkIcon, Sparkles } from 'lucide-react';
import { ProcessingModal } from '@/components/ProcessingModal';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function BurnSharePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [ttl, setTtl] = useState<number>(60);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCreateShare = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const file = files[0].file;
      const { cipherBuffer, iv, keyBase64 } = await encryptFileForShare(file);

      // Convert cipher to base64
      let binary = '';
      const bytes = new Uint8Array(cipherBuffer);
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192) as any);
      }
      const dataB64 = btoa(binary);
      const ivB64 = btoa(String.fromCharCode(...iv));

      const shareId = Math.random().toString(36).substring(2, 10);

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shareId,
          data: dataB64,
          iv: ivB64,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          ttlMinutes: ttl,
          burnOnRead: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to create share on server');

      const url = `${window.location.origin}/share/${shareId}#key=${encodeURIComponent(keyBase64)}`;
      setShareUrl(url);
    } catch (err: any) {
      alert(`Share generation failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const copyUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold mb-3">
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span>End-to-End Encrypted Confidential Sharing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Burn-After-Reading Confidential Share
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Documents are securely encrypted directly on your device before transfer. The access key is embedded in your link and never stored. Once opened, the file permanently self-destructs.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept="*/*"
          multiple={false}
          title="Select or Drop a Confidential File"
          subtitle="All documents are private and encrypted directly on your device"
          primaryColor="#ef4444"
        />
      </div>

      {files.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-500" />
              <span>Self-Destruction Parameters</span>
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Expiration Timer
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { mins: 15, label: '15 Minutes' },
                { mins: 60, label: '1 Hour' },
                { mins: 1440, label: '24 Hours' },
              ].map((t) => (
                <button
                  key={t.mins}
                  onClick={() => setTtl(t.mins)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    ttl === t.mins
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateShare}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Flame className="w-4 h-4" />
            <span>Encrypt & Create Burn-After-Reading Link</span>
          </button>

          {shareUrl && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 dark:text-red-300">
                  Secure Single-Use Link
                </span>
                <span className="text-[11px] font-semibold text-red-600">Self-destructs upon opening</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none"
                />
                <button
                  onClick={copyUrl}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="security"
          toolSlug="burn-share"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={`Zero-Knowledge Encrypted File: ${files[0]?.file.name} (${(files[0]?.file.size / 1024).toFixed(1)} KB), AES-256-GCM in-browser, Self-destruct TTL: ${ttl} minutes`}
        />
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="Securing document with end-to-end encryption..." />
    </div>
  );
}
