'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { hideMessageInImage, revealMessageFromImage } from '@/lib/security/steganography';
import { EyeOff, Download, Copy, CheckCircle2, Lock, Unlock, Sparkles, ShieldCheck } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function SteganographyPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [tab, setTab] = useState<'hide' | 'reveal'>('hide');
  const [secretMessage, setSecretMessage] = useState('TOP SECRET: Password is #CyberShield2026!');
  const [revealedText, setRevealedText] = useState<string | null>(null);
  const [stegoBlob, setStegoBlob] = useState<Blob | null>(null);
  const [stegoUrl, setStegoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setStegoBlob(null);
    setStegoUrl(null);
    setRevealedText(null);

    if (newFiles.length > 0 && tab === 'reveal') {
      setProcessing(true);
      try {
        const text = await revealMessageFromImage(newFiles[0].file);
        setRevealedText(text);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleHide = async () => {
    if (files.length === 0 || !secretMessage.trim()) return;
    setProcessing(true);
    try {
      const res = await hideMessageInImage(files[0].file, secretMessage);
      setStegoBlob(res.blob);
      setStegoUrl(res.dataUrl);
    } catch (err: any) {
      alert(`Steganography failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const copyRevealed = () => {
    if (!revealedText) return;
    navigator.clipboard.writeText(revealedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold mb-3">
          <EyeOff className="w-3.5 h-3.5" />
          <span>Spatial LSB Image Steganography</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Hide Secret Messages Inside Images
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Embed confidential text invisibly into pixel color bitstreams without any perceptible image degradation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => {
            setTab('hide');
            setFiles([]);
            setStegoBlob(null);
          }}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'hide'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Hide Secret in Image
        </button>
        <button
          onClick={() => {
            setTab('reveal');
            setFiles([]);
            setRevealedText(null);
          }}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'reveal'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Extract Hidden Secret
        </button>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="image/png,image/jpeg,image/webp"
          multiple={false}
          title="Select or Drop a Carrier PNG Image"
          subtitle="PNG recommended for lossless bit preservation"
          primaryColor="#18181b"
        />
      </div>

      {tab === 'hide' && files.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Confidential Message Content</span>
          </h2>
          <textarea
            value={secretMessage}
            onChange={(e) => setSecretMessage(e.target.value)}
            placeholder="Type confidential password, keys, or message..."
            className="w-full h-32 p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
          />
          <button
            onClick={handleHide}
            className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <EyeOff className="w-4 h-4" />
            <span>Embed Secret Message Invisibly</span>
          </button>

          {stegoBlob && stegoUrl && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={stegoUrl} alt="Stego" className="w-16 h-16 object-cover rounded-xl border" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Stego Image Ready</div>
                  <div className="text-[11px] text-zinc-500">Looks identical to human eyes</div>
                </div>
              </div>
              <button
                onClick={() => saveAs(stegoBlob, `stego_${files[0].name.replace(/\.[^/.]+$/, '')}.png`)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Stego PNG</span>
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'reveal' && revealedText && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-500" />
              <span>Decoded Hidden Secret</span>
            </h2>
            <button
              onClick={copyRevealed}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
            {revealedText}
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="security"
          toolSlug="steganography"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={revealedText ? `Steganography Revealed Message: ${revealedText}` : `Steganography hidden payload: ${secretMessage}`}
        />
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="Processing image data..." />
    </div>
  );
}
