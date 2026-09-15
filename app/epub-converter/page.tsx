'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { parseEpub, createEpubFromMarkdown, ParsedEpub } from '@/lib/data/epub-parser';
import { BookOpen, Download, Copy, CheckCircle2, Sparkles, BookText, FileText } from 'lucide-react';
import saveAs from 'file-saver';

export default function EpubConverterPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [epub, setEpub] = useState<ParsedEpub | null>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [createTitle, setCreateTitle] = useState('My New eBook');
  const [createAuthor, setCreateAuthor] = useState('Author Name');
  const [createMarkdown, setCreateMarkdown] = useState('# Chapter 1: Introduction\n\nOnce upon a time in the digital era...');
  const [tab, setTab] = useState<'read' | 'create'>('read');
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const parsed = await parseEpub(newFiles[0].file);
        setEpub(parsed);
        setActiveChapter(0);
      } catch (err: any) {
        alert(`Failed to read EPUB: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setEpub(null);
    }
  };

  const downloadMarkdown = () => {
    if (!epub) return;
    const blob = new Blob([epub.fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${epub.title}.md`);
  };

  const handleCreateEpub = async () => {
    try {
      const blob = await createEpubFromMarkdown(createTitle, createAuthor, createMarkdown);
      saveAs(blob, `${createTitle.toLowerCase().replace(/\s+/g, '_')}.epub`);
    } catch (err: any) {
      alert(`EPUB packaging failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>eBook & EPUB Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Read, Extract & Build EPUB eBooks
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Unpack `.epub` eBooks to clean Markdown or build new EPUBs from your Markdown text.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => setTab('read')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'read'
              ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Unpack & Read EPUB
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'create'
              ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Build EPUB from Markdown
        </button>
      </div>

      {tab === 'read' ? (
        <>
          <div className="mb-8">
            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              accept=".epub,application/epub+zip"
              multiple={false}
              title="Select or Drop an EPUB eBook"
              subtitle="Supports standard .epub book files"
              primaryColor="#d946ef"
            />
          </div>

          {epub && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Chapters Sidebar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Table of Contents ({epub.chapters.length})</span>
                </div>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {epub.chapters.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChapter(idx)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold truncate transition-colors ${
                        activeChapter === idx
                          ? 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {ch.title}
                    </button>
                  ))}
                </div>
                <button
                  onClick={downloadMarkdown}
                  className="w-full py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Extract as Markdown</span>
                </button>
              </div>

              {/* Reader Window */}
              <div className="lg:col-span-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl min-h-[450px]">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                  {epub.chapters[activeChapter]?.title || 'Chapter Preview'}
                </h2>
                <div
                  className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: epub.chapters[activeChapter]?.htmlContent || '<p>No content in chapter</p>',
                  }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-3xl mx-auto space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Create a New EPUB Book
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Book Title</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Author</label>
              <input
                type="text"
                value={createAuthor}
                onChange={(e) => setCreateAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Book Content (Markdown)</label>
            <textarea
              value={createMarkdown}
              onChange={(e) => setCreateMarkdown(e.target.value)}
              className="w-full h-64 p-4 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
            />
          </div>
          <button
            onClick={handleCreateEpub}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-bold text-sm shadow-md shadow-fuchsia-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Package & Download EPUB</span>
          </button>
        </div>
      )}
    </div>
  );
}
