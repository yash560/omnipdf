'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { protectPdf } from '@/lib/pdf/security';
import { downloadBytes } from '@/lib/pdf/core';

export default function ProtectPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleProtect = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    if (!password) {
      alert('Please enter a secure password.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(30);
      setStatusText('Encrypting PDF streams with AES password protection...');

      const arrayBuf = files[0].arrayBuffer;
      const protectedPdf = await protectPdf(arrayBuf, password);

      setProgress(100);
      setResultBytes(protectedPdf);
      setIsProcessing(false);
      setStatusText('PDF Protected Successfully!');
    } catch (err) {
      console.error('Protect error:', err);
      alert('Failed to protect PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_protected.pdf';
      downloadBytes(resultBytes, outName);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPassword('');
    setConfirmPassword('');
    setResultBytes(null);
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Protect PDF with Password
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Encrypt your PDF with standard password security to prevent unauthorized access.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          multiple={false}
          primaryColor="#d946ef"
          title="Select PDF file to encrypt"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Choose Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-fuchsia-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Repeat Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-fuchsia-500"
              />
            </div>

            {/* Action */}
            <div className="pt-2">
              <button
                onClick={handleProtect}
                disabled={isProcessing || !password}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-fuchsia-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Protect PDF File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_protected.pdf'}
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Encrypting PDF"
      />
    </div>
  );
}
