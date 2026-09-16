'use client';

import { useState } from 'react';
import { ShieldCheck, Code, Lock, Terminal, Copy, Check, Info, FileCheck } from 'lucide-react';
import { OpenSecurityAuditInfo } from '@/types/share';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface OpenSecurityInspectorProps {
  audit: OpenSecurityAuditInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function OpenSecurityInspector({ audit, isOpen, onClose }: OpenSecurityInspectorProps) {
  useBodyScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState<'params' | 'typescript' | 'python'>('params');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (text: string, tabKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop">
      <div
        className="w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Open Security & Cryptographic Proof
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/30">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verifiable AES-256-GCM client-side encryption. Server cannot read or decrypt your file.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors btn-press cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('params')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer btn-press ${
              activeTab === 'params'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Spec</span>
          </button>

          <button
            onClick={() => setActiveTab('typescript')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer btn-press ${
              activeTab === 'typescript'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>TypeScript / Node.js</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer btn-press ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Python Decryption Script</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === 'params' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300">
                <div className="font-extrabold flex items-center gap-2 mb-1 text-sm">
                  <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Mathematical Zero-Knowledge Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400">
                  The ciphertext stored in the cloud was generated in your browser memory before any network transmission. The decryption key never passes through server logs, proxies, or backend databases.
                </p>
              </div>

              {/* Spec Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Cipher Algorithm
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {audit.algorithm} (256-bit Key)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Key Derivation (KDF)
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {audit.keyDerivationFunction} ({audit.pbkdf2Iterations.toLocaleString()} iterations)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Initialization Vector (IV - Hex)
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all">
                    {audit.ivHex}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Cryptographic Salt (Hex)
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all">
                    {audit.saltHex}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 sm:col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Plaintext SHA-256 Integrity Checksum
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all">
                    {audit.sha256DigestHex}
                  </span>
                </div>
              </div>

              {/* Decryption Pipeline Steps */}
              <div>
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-2">
                  Verification Pipeline & Constraints
                </h4>
                <div className="space-y-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  {audit.decryptionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'typescript' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[11px]">
                  Runnable TypeScript / Node.js 18+ verification code:
                </span>
                <button
                  onClick={() => handleCopyCode(audit.typescriptCode, 'ts')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-all btn-press"
                >
                  {copiedTab === 'ts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'ts' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-zinc-800">
                <code>{audit.typescriptCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[11px]">
                  Independent Python 3 `cryptography` script for offline verification:
                </span>
                <button
                  onClick={() => handleCopyCode(audit.pythonCode, 'py')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-all btn-press"
                >
                  {copiedTab === 'py' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'py' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-zinc-800">
                <code>{audit.pythonCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            Complies with NIST SP 800-38D & FIPS 140-3 zero-trust standards.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer btn-press"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
