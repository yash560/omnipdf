'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ShieldCheck, Heart, Sparkles, Lock, Cpu } from 'lucide-react';
import { PDF_TOOLS } from '@/lib/tools-data';

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/drive' || pathname?.startsWith('/drive/')) {
    return null;
  }

  const organizeTools = PDF_TOOLS.filter((t) => t.category === 'organize');
  const optimizeTools = PDF_TOOLS.filter((t) => t.category === 'optimize' || t.category === 'security');
  const editTools = PDF_TOOLS.filter((t) => t.category === 'edit' || t.category === 'smart');
  const convertTools = PDF_TOOLS.filter((t) => t.category === 'convert');

  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 mt-auto">
      {/* Tier 1: Privacy & Architecture Guarantee Banner */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-1">
                100% Zero-Upload Privacy
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                All document processing happens inside your browser using WebAssembly. Your files never leave your computer.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-1">
                Zero Limits & Instant Speed
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                No waiting in queues, no daily caps, and no 25MB file size limits. Process gigabytes in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-1">
                Military-Grade Security
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Compliant with GDPR, HIPAA, and ISO data isolation standards by keeping all memory buffers client-bound.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2: Categorized Tool Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Organize PDF
            </h5>
            <ul className="space-y-2.5 text-xs">
              {organizeTools.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.slug}`}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Edit & Smart Studio
            </h5>
            <ul className="space-y-2.5 text-xs">
              {editTools.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.slug}`}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Security & Optimize
            </h5>
            <ul className="space-y-2.5 text-xs">
              {optimizeTools.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.slug}`}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Convert & Export
            </h5>
            <ul className="space-y-2.5 text-xs">
              {convertTools.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.slug}`}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tier 3: Bottom Copyright & Yash Jain Attribution */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
              F
            </div>
            <span>
              © {new Date().getFullYear()} FileCraft. Architected & Designed by{' '}
              <a
                href="https://thewebvale.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-rose-500 underline underline-offset-2"
              >
                Yash Jain
              </a>
              . Powered by{' '}
              <a
                href="https://thewebvale.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-rose-500 hover:underline"
              >
                TheWebVale
              </a>
              .
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500">
            <span className="flex items-center gap-1">
              Built with Next.js 15 & WebAssembly <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
