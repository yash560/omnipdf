'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  ShieldCheck, 
  Download, 
  Printer, 
  EyeOff, 
  Code, 
  ArrowLeft, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { EncryptedSharePackage, DecryptedSharePayload, OpenSecurityAuditInfo } from '@/types/share';
import { 
  decryptSharePayload, 
  base64ToArrayBuffer, 
  generateOpenSecurityAudit 
} from '@/lib/crypto/secure-share';
import { getClientSharedPackage } from '@/lib/storage/cloud-share-db';
import { getPdfJs, downloadBytes } from '@/lib/pdf/core';
import { OpenSecurityInspector } from '@/components/share/OpenSecurityInspector';

interface ShareViewerPageProps {
  params: Promise<{ id: string }>;
}

export default function ShareViewerPage({ params }: ShareViewerPageProps) {
  const resolvedParams = use(params);
  const shareId = resolvedParams.id;

  // Package & Decryption State
  const [encryptedPackage, setEncryptedPackage] = useState<EncryptedSharePackage | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<DecryptedSharePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Passcode State
  const [passcode, setPasscode] = useState('');
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // PDF Viewer State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Security Audit State
  const [auditInfo, setAuditInfo] = useState<OpenSecurityAuditInfo | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // 1. Fetch Encrypted Package from API (or Client IndexedDB Fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadPackage() {
      try {
        setLoading(true);
        let pkg: EncryptedSharePackage | null = null;

        // Try API
        try {
          const res = await fetch(`/api/share/${shareId}`);
          if (res.ok) {
            pkg = await res.json();
          }
        } catch (e) {
          console.warn('API fetch failed, checking local IndexedDB share store:', e);
        }

        // Fallback to IndexedDB
        if (!pkg) {
          pkg = await getClientSharedPackage(shareId);
        }

        if (!isMounted) return;

        if (!pkg) {
          setError('This share link has expired, reached its view limit, or does not exist.');
          setLoading(false);
          return;
        }

        setEncryptedPackage(pkg);

        // Check if key is present in URL hash (#key=...)
        const hash = window.location.hash;
        const keyMatch = hash.match(/#key=([^&]+)/);
        const urlKey = keyMatch ? decodeURIComponent(keyMatch[1]) : null;

        if (pkg.kdf === 'PBKDF2-SHA256' || pkg.permissions.requirePasscode) {
          // Requires manual passcode input
          setPasscodeRequired(true);
          setLoading(false);
        } else if (urlKey) {
          // Zero-knowledge automatic decrypt with URL fragment key
          try {
            const decrypted = await decryptSharePayload(pkg, urlKey);
            setDecryptedPayload(decrypted);
            const audit = generateOpenSecurityAudit(pkg, urlKey, false);
            setAuditInfo(audit);
          } catch (decErr: any) {
            setError('Decryption failed: The secret key in the link is invalid or corrupted.');
          }
          setLoading(false);
        } else {
          // No key in URL and no passcode specified
          setPasscodeRequired(true);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load share package.');
        setLoading(false);
      }
    }

    loadPackage();

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  // 2. Handle Manual Passcode Decryption
  const handleDecryptWithPasscode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!encryptedPackage || !passcode.trim()) return;

    setIsDecrypting(true);
    setPasscodeError(null);

    try {
      const decrypted = await decryptSharePayload(encryptedPackage, passcode.trim());
      setDecryptedPayload(decrypted);
      const audit = generateOpenSecurityAudit(encryptedPackage, passcode.trim(), true);
      setAuditInfo(audit);
      setPasscodeRequired(false);
    } catch (err: any) {
      setPasscodeError('Incorrect passcode or corrupt ciphertext. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // 3. Initialize PDF.js Document once Decrypted
  useEffect(() => {
    if (!decryptedPayload) return;

    let isMounted = true;
    async function renderPdfDocument() {
      try {
        const pdfBytes = base64ToArrayBuffer(decryptedPayload!.pdfBase64);
        const pdfjs = await getPdfJs();
        if (!pdfjs) return;
        const loadingTask = pdfjs.getDocument({
          data: pdfBytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Failed to parse decrypted PDF:', err);
        setError('Error rendering decrypted PDF document.');
      }
    }

    renderPdfDocument();
    return () => {
      isMounted = false;
    };
  }, [decryptedPayload]);

  // 4. Render Active Page Canvas with High DPI & Watermarking
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const baseViewport = page.getViewport({ scale: 1.0 });
        const scale = zoom * 1.5; // High resolution rendering scale
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${baseViewport.width * zoom}px`;
        canvas.style.height = `${baseViewport.height * zoom}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        renderTask = page.render(renderContext as any);
        await renderTask.promise;

        // Render Watermark if enabled in permissions
        if (encryptedPackage?.permissions.watermarkText) {
          ctx.save();
          ctx.translate(viewport.width / 2, viewport.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.font = `bold ${Math.max(24, Math.floor(viewport.width / 18))}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.14)'; // Subtle red security tint
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(encryptedPackage.permissions.watermarkText.toUpperCase(), 0, 0);
          ctx.restore();
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom, encryptedPackage]);

  // Handle Download Action (Respects Permission)
  const handleDownloadPdf = () => {
    if (!decryptedPayload || !encryptedPackage?.permissions.allowDownload) return;
    const bytes = base64ToArrayBuffer(decryptedPayload.pdfBase64);
    downloadBytes(bytes, decryptedPayload.filename || 'shared_document.pdf');
  };

  // Handle Print Action (Respects Permission)
  const handlePrint = () => {
    if (!encryptedPackage?.permissions.allowPrint) {
      alert('Printing has been restricted by the document sender.');
      return;
    }
    window.print();
  };

  // Keyboard Shortcuts & Guardrails
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If download disabled, block Cmd+S / Ctrl+S
      if (!encryptedPackage?.permissions.allowDownload && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        alert('Downloading and saving has been restricted by the sender.');
      }
      // If print disabled, block Cmd+P / Ctrl+P
      if (!encryptedPackage?.permissions.allowPrint && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        alert('Printing has been restricted by the sender.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [encryptedPackage]);

  // Loading Screen
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center animate-pulse mb-4 border border-purple-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
          Retrieving Zero-Knowledge Encrypted Package...
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Validating cryptographic envelope and permissions...
        </p>
      </div>
    );
  }

  // Error Screen
  if (error || !encryptedPackage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 border border-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
          Unable to Open Share Link
        </h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          {error || 'This link may have expired or been revoked by the owner.'}
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90"
        >
          Return to OmniPDF Home
        </Link>
      </div>
    );
  }

  // Passcode Unlock Screen
  if (passcodeRequired) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3 border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Passcode Protected Document
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Encrypted via <strong>AES-256-GCM</strong>. Enter the secret passcode to derive the decryption key in your browser.
            </p>
          </div>

          <form onSubmit={handleDecryptWithPasscode} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Document Passcode / PIN
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Enter decryption passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500 font-mono"
              />
              {passcodeError && (
                <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{passcodeError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isDecrypting || !passcode.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isDecrypting ? 'Deriving Key & Decrypting...' : 'Decrypt & View Document'}</span>
            </button>
          </form>

          {/* Security Info Badge */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Client-Side PBKDF2</span>
            </span>
            <span>100,000 Rounds</span>
          </div>
        </div>
      </div>
    );
  }

  // Decrypted Secure Viewer Interface
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-zinc-100 dark:bg-zinc-950">
      {/* Top Security Banner & Controls */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-30 shadow-xs">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OmniPDF</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
            <FileText className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="truncate">{decryptedPayload?.filename || 'Encrypted Document'}</span>
          </div>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/20">
            Decrypted • Zero-Knowledge
          </span>
        </div>

        {/* Center: Pagination & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-xl">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold px-1 text-zinc-800 dark:text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-xl">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
              className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold px-1 text-zinc-800 dark:text-zinc-200">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
              className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Security & Actions */}
        <div className="flex items-center gap-2">
          {/* Open Security Proof Button */}
          {auditInfo && (
            <button
              onClick={() => setInspectorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open Security Audit</span>
            </button>
          )}

          {/* Print Button (Enforces Permission) */}
          {encryptedPackage.permissions.allowPrint ? (
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
          ) : (
            <div
              className="p-1.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed opacity-50 flex items-center gap-1"
              title="Print disabled by document owner"
            >
              <EyeOff className="w-4 h-4" />
            </div>
          )}

          {/* Download Button (Enforces Permission) */}
          {encryptedPackage.permissions.allowDownload ? (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs font-bold cursor-not-allowed select-none"
              title="Downloads have been disabled by the document sender for confidentiality."
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>View-Only Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div 
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative select-none"
        onContextMenu={(e) => {
          if (!encryptedPackage.permissions.allowDownload) {
            e.preventDefault(); // Prevent right-click save image if downloads are disabled
          }
        }}
      >
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
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
    </div>
  );
}
