'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FileEdit, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Plus, 
  RotateCcw,
  Trash2,
  Clock
} from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { CanvasStudio } from '@/components/editor/CanvasStudio';
import { StagedFile } from '@/types/pdf';
import { StudioSession } from '@/types/session';
import { getAllSessionsFromDB, deleteSessionFromDB } from '@/lib/storage/session-db';

function EditPageContent() {
  const searchParams = useSearchParams();
  const requestedSessionId = searchParams.get('session');
  const isNew = searchParams.get('new') === 'true';

  const [files, setFiles] = useState<StagedFile[]>([]);
  const [activeSession, setActiveSession] = useState<StudioSession | null>(null);
  const [allSessions, setAllSessions] = useState<StudioSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sessions from IndexedDB on mount or searchParam change
  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      try {
        setLoading(true);
        const stored = await getAllSessionsFromDB();
        if (!isMounted) return;

        setAllSessions(stored);

        if (requestedSessionId) {
          const target = stored.find((s) => s.id === requestedSessionId);
          if (target) {
            setActiveSession(target);
            setLoading(false);
            return;
          }
        }

        // If not explicitly requesting a new blank upload and sessions exist in DB, resume latest
        if (!isNew && stored.length > 0 && files.length === 0) {
          setActiveSession(stored[0]);
        } else if (isNew) {
          setActiveSession(null);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [requestedSessionId, isNew]);

  const activePdf = files[0];

  const handleSelectDraft = (sess: StudioSession) => {
    setFiles([]);
    setActiveSession(sess);
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteSessionFromDB(id);
    const updated = allSessions.filter((s) => s.id !== id);
    setAllSessions(updated);
    if (activeSession?.id === id) {
      if (updated.length > 0) {
        setActiveSession(updated[0]);
      } else {
        setActiveSession(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold">Resuming Your Document Workspace...</span>
      </div>
    );
  }

  // Active Studio Mode (either newly uploaded file or resumed session from IndexedDB)
  if ((activePdf && activePdf.arrayBuffer) || (activeSession && activeSession.pdfData)) {
    const displayPdfData = activePdf?.arrayBuffer || activeSession?.pdfData;
    const displayFilename = activePdf?.name || activeSession?.filename || 'document.pdf';
    const targetSessionId = activeSession?.id;

    return (
      <div className="flex-1 flex flex-col h-full w-full">
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs shadow-xs z-10">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Studio</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-xs sm:max-w-md">
              {displayFilename}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFiles([]);
                setActiveSession(null);
              }}
              className="text-rose-500 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New PDF</span>
            </button>
          </div>
        </div>

        <CanvasStudio 
          initialSessionId={targetSessionId}
          pdfData={displayPdfData} 
          filename={displayFilename} 
        />
      </div>
    );
  }

  // Upload New Document / Drafts Selection Screen
  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <FileEdit className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Interactive PDF Canvas Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Pro
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Add text, freehand drawings, highlighters, geometric shapes, signatures, and redactions directly on your document.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dropzone Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <FileDropzone
          files={files}
          onFilesChange={(newFiles) => {
            setFiles(newFiles);
            if (newFiles.length > 0) {
              setActiveSession(null);
            }
          }}
          multiple={false}
          primaryColor="#ef4444"
          title="Select PDF file to edit in Canvas Studio"
          subtitle="or drop a PDF document to open the full visual editor"
        />
      </div>

      {/* Quick Resume Active Drafts Section */}
      {allSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Or Resume an Active Document Draft ({allSessions.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => handleSelectDraft(sess)}
                className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                        {sess.filename}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {sess.annotations?.length || 0} Annotations • {(sess.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDraft(sess.id, e)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{new Date(sess.lastModified).toLocaleDateString()}</span>
                  </span>
                  <span className="font-bold text-rose-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
            ✒️ Vector Ink & Text
          </div>
          <div className="text-[11px] text-zinc-500">
            Crisp typography and smooth bezier pen strokes
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
            ✍️ e-Signatures
          </div>
          <div className="text-[11px] text-zinc-500">
            Draw, type calligraphy, or upload signature stamps
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
            ⬛ Permanent Redact
          </div>
          <div className="text-[11px] text-zinc-500">
            Blackout sensitive PII and private data safely
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
            ⚡ 100% Client-Side
          </div>
          <div className="text-[11px] text-zinc-500">
            Zero upload delay, files never leave your device
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold">Loading Studio...</span>
      </div>
    }>
      <EditPageContent />
    </Suspense>
  );
}
