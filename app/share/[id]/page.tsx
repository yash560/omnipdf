'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { decryptSharePayload } from '@/lib/security/burn-share';
import { Flame, Download, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import saveAs from 'file-saver';

export default function ShareRecipientPage() {
  const params = useParams();
  const id = params?.id as string;
  const [status, setStatus] = useState<'loading' | 'ready' | 'burned' | 'error'>('loading');
  const [fileName, setFileName] = useState('');
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadAndDecrypt() {
      try {
        const hash = window.location.hash;
        const keyMatch = hash.match(/key=([^&]+)/);
        if (!keyMatch) {
          throw new Error('Encryption key missing from URL hash fragment.');
        }
        const keyBase64 = decodeURIComponent(keyMatch[1]);

        const res = await fetch(`/api/share?id=${id}`);
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            setStatus('burned');
            return;
          }
          throw new Error('Failed to fetch encrypted payload.');
        }

        const data = await res.json();
        setFileName(data.name);

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
        setStatus('ready');
      } catch (err: any) {
        setErrorMsg(err.message);
        setStatus('error');
      }
    }

    loadAndDecrypt();
  }, [id]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {status === 'loading' && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <Flame className="w-8 h-8 text-red-500 animate-pulse mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Decrypting Secure Share...</h2>
          <p className="text-xs text-zinc-500">Decrypting payload in-browser via AES-256-GCM.</p>
        </div>
      )}

      {status === 'ready' && decryptedBlob && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1">
              {fileName}
            </h2>
            <p className="text-xs text-zinc-500">
              Payload decrypted successfully. This link has now burned and cannot be accessed again.
            </p>
          </div>

          <button
            onClick={() => saveAs(decryptedBlob, fileName)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Download Intact File</span>
          </button>
        </div>
      )}

      {status === 'burned' && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">This Share has Burned</h2>
          <p className="text-xs text-zinc-500">
            This file was already opened or expired and has been permanently purged from server memory.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Decryption Error</h2>
          <p className="text-xs text-zinc-500">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
