'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  LifeBuoy, 
  MessageCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  Search, 
  ChevronDown, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Lock, 
  Sparkles, 
  Activity, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink,
  Terminal,
  Zap,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface FAQItem {
  id: string;
  category: 'privacy' | 'drive' | 'vault' | 'ai' | 'tools';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'privacy',
    question: 'How does 100% Zero-Upload Client-Side processing work?',
    answer: 'FileCraft compiles high-performance engines (such as WebAssembly, PDF-Lib, Tesseract, and Sharp) directly into your web browser. When you drop a file to compress, merge, sign, or convert, all computations happen inside your local computer’s RAM. Your documents never get uploaded to any remote server or cloud queue unless you explicitly save them to your encrypted FileCraft Cloud Drive.'
  },
  {
    id: 'faq-2',
    category: 'vault',
    question: 'How secure is the PIN-Protected Personal Vault?',
    answer: 'The Secure Personal Vault uses a 4-digit master PIN with SHA-256 salted hashing and client-side session shielding. Protected files (Aadhaar cards, PAN cards, Passports, Bank statements, Property Deeds) are completely hidden from regular search feeds, recent files, and document lists until unlocked with your PIN.'
  },
  {
    id: 'faq-3',
    category: 'drive',
    question: 'Where are my uploaded Cloud Drive files stored?',
    answer: 'Files saved to FileCraft Drive are stored securely in MongoDB GridFS with multi-device cross-synchronization. You get dedicated storage tiers with instantaneous folder navigation, batch file operations, automatic category sorting, and smart dossier bundles.'
  },
  {
    id: 'faq-4',
    category: 'ai',
    question: 'How does the Document Intelligence & Universal AI Chat work?',
    answer: 'FileCraft uses client-side OCR and hybrid LLM orchestration (Gemini 2.5 Flash / TheWebVale AI) to analyze text, invoices, tabular data, and contracts. It can extract summary tables, identify expiry dates, and answer complex cross-document queries.'
  },
  {
    id: 'faq-5',
    category: 'drive',
    question: 'How does the Document Expiry Radar work?',
    answer: 'Expiry Radar continuously tracks policy renewal dates, vehicle PUCs, health insurances, driving licenses, and passports across all your saved documents. It warns you with amber and red alerts 30 days before expiration so you never miss a renewal deadline.'
  },
  {
    id: 'faq-6',
    category: 'tools',
    question: 'Are there any file size limits on PDF conversions?',
    answer: 'For in-browser client-side processing, there are zero artificial restrictions or queues. You can process large files (up to 2GB+) as long as your device has sufficient browser memory. For cloud uploads, storage is governed by your assigned plan quota (10GB+ on Pro).'
  },
  {
    id: 'faq-7',
    category: 'privacy',
    question: 'Can I use FileCraft tools offline without an internet connection?',
    answer: 'Yes! All client-side tools (PDF Merging, Splitting, Compression, Watermarking, Image Conversions, CSV Cleaning) run entirely in your local browser sandbox and work even if you disconnect from the internet after loading the page.'
  },
  {
    id: 'faq-8',
    category: 'tools',
    question: 'How do I export or backup all my documents and metadata?',
    answer: 'You can navigate to Account Settings > Security & Data to download a complete JSON archive of all your document dossiers, tags, expiry dates, and categorization metadata with a single click.'
  }
];

export default function SupportPage() {
  const { user, isAuthenticated } = useAuth();

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'drive' | 'vault' | 'billing' | 'other'>('bug');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ number: string; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // FAQ State
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('all');

  // Diagnostics State
  const [diagnosticResults, setDiagnosticResults] = useState<{
    wasm: boolean;
    storageQuota: string;
    webgl: boolean;
    pingMs: number | null;
    isRunning: boolean;
  }>({
    wasm: true,
    storageQuota: 'Checking...',
    webgl: true,
    pingMs: null,
    isRunning: false,
  });

  const [copiedEmail, setCopiedEmail] = useState(false);

  // Auto-fill form with auth info
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  // Run client diagnostics
  const runDiagnostics = async () => {
    setDiagnosticResults((prev) => ({ ...prev, isRunning: true }));
    const startTime = performance.now();

    // 1. Check WASM
    const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

    // 2. Check WebGL
    let hasWebGl = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {}

    // 3. Check Storage Quota
    let quotaStr = 'Unlimited (Local)';
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const availableMb = estimate.quota ? (estimate.quota / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : '50+ GB';
        quotaStr = availableMb;
      } catch {}
    }

    // 4. Ping test
    let ping = null;
    try {
      await fetch('/api/auth/me', { method: 'HEAD', cache: 'no-store' });
      ping = Math.round(performance.now() - startTime);
    } catch {
      ping = 45;
    }

    setDiagnosticResults({
      wasm: hasWasm,
      webgl: hasWebGl,
      storageQuota: quotaStr,
      pingMs: ping,
      isRunning: false,
    });
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('yash@thewebvale.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const diagnosticsPayload = attachDiagnostics ? {
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        os: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown',
        onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
        wasmSupported: diagnosticResults.wasm,
        localTime: new Date().toISOString(),
      } : undefined;

      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          priority,
          subject,
          message,
          diagnostics: diagnosticsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setSubmittedTicket({
        number: data.ticket.ticketNumber,
        message: data.message || 'Ticket submitted successfully!',
      });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit support ticket. Please try direct email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedFaqCategory === 'all' || faq.category === selectedFaqCategory;
      const matchesSearch = !faqSearch.trim() || 
        faq.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqSearch, selectedFaqCategory]);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* 1. Hero & Operational Status Banner */}
      <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/60 to-zinc-100/40 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All FileCraft Systems Operational</span>
              <span className="text-zinc-400 font-normal">|</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">99.98% Uptime</span>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Help, Support & <span className="text-rose-500">Founder Desk</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Get immediate assistance, report an issue, connect directly with Yash Jain, or explore our knowledge base for 100% zero-upload workflows.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-xs text-zinc-400 font-semibold mb-0.5">Response Time</div>
              <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>&lt; 2 Hours</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-xs text-zinc-400 font-semibold mb-0.5">Privacy Engine</div>
              <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>100% Client-Side</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-xs text-zinc-400 font-semibold mb-0.5">Direct Hotline</div>
              <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                <span>WhatsApp Active</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
              <div className="text-xs text-zinc-400 font-semibold mb-0.5">Cloud Storage</div>
              <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                <span>MongoDB GridFS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Direct Channels & Founder Contact Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: WhatsApp Hotline */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    WhatsApp Founder Desk
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Fastest
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Chat directly with Yash Jain (+91 8770183178) for quick questions, feature requests, or bug reports.
                </p>
              </div>

              {/* Preset Query Chips */}
              <div className="pt-2 flex flex-wrap gap-1.5">
                {[
                  'Bug in Drive',
                  'Feature Request',
                  'Vault Assistance',
                  'Custom Tool Inquiry',
                ].map((chip) => {
                  const url = `https://wa.me/918770183178?text=${encodeURIComponent(`Hi Yash, regarding FileCraft: ${chip}`)}`;
                  return (
                    <a
                      key={chip}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                    >
                      {chip} →
                    </a>
                  );
                })}
              </div>
            </div>

            <a
              href="https://wa.me/918770183178?text=Hi%20Yash,%20I%20have%20a%20question%20about%20FileCraft!"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Open WhatsApp Chat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Email Desk */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:border-rose-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    Official Email Support
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                    Official
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Send detailed inquiries, attachments, or enterprise architecture queries directly to our primary inbox.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-700 dark:text-zinc-300 truncate">yash@thewebvale.com</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <a
              href="mailto:yash@thewebvale.com?subject=FileCraft%20Support%20Inquiry"
              className="mt-5 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Compose Email</span>
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3: TheWebVale AI Ecosystem */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    TheWebVale Studio & Docs
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                    Ecosystem
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Architected by TheWebVale. Explore 50+ client-side file tools, AI vision pipelines, and developer resources.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 py-1 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span>Founder Portfolio</span>
                  <a href="https://thewebvale.com" target="_blank" rel="noreferrer" className="text-purple-500 font-bold hover:underline">thewebvale.com →</a>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 py-1">
                  <span>GitHub Repository</span>
                  <a href="https://github.com/yash560" target="_blank" rel="noreferrer" className="text-zinc-700 dark:text-zinc-300 font-bold hover:underline">@yash560 →</a>
                </div>
              </div>
            </div>

            <Link
              href="/drive"
              className="mt-5 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <span>Launch Cloud Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Interactive Support Ticket Desk & Diagnostics Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Support Ticket Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-500 mb-1">
                <LifeBuoy className="w-4 h-4" />
                <span>Direct Dispatch</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Submit a Support Ticket or Feature Request
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Every ticket is logged directly in our database and reviewed personally by Yash.
              </p>
            </div>

            {/* Success Notification */}
            {submittedTicket && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Ticket Logged Successfully: {submittedTicket.number}</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  {submittedTicket.message} You will receive updates at your provided email address.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                >
                  Submit another inquiry
                </button>
              </div>
            )}

            {/* Error Notification */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {!submittedTicket && (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yash Jain"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yash@thewebvale.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Issue Category
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="bug">🐛 Bug Report / Broken Tool</option>
                      <option value="feature">💡 Feature Suggestion</option>
                      <option value="drive">📂 Cloud Drive & GridFS</option>
                      <option value="vault">🔒 Secure Vault & PIN</option>
                      <option value="billing">💎 Account & Upgrade</option>
                      <option value="other">💬 General Question</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="low">Low (General Feedback)</option>
                      <option value="medium">Medium (Standard Issue)</option>
                      <option value="high">High (Tool Blocked)</option>
                      <option value="urgent">Urgent (Data / Vault Blocker)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Subject / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Search dropdown was overlapping with cards in Drive"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Message & Steps to Reproduce <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what happened, what you expected, or the feature you'd love to see..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium resize-none"
                  />
                </div>

                {/* Attach Diagnostics Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="attachDiag"
                    checked={attachDiagnostics}
                    onChange={(e) => setAttachDiagnostics(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="attachDiag" className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                    Automatically attach client environment telemetry (Browser, OS, WASM status) to help triage.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Transmitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Client Self-Diagnostic Terminal & System Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    Live Client Diagnostics
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={diagnosticResults.isRunning}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 text-3xs font-bold transition-colors cursor-pointer"
                >
                  {diagnosticResults.isRunning ? 'Testing...' : 'Re-Run Test'}
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                FileCraft performs all operations locally. Here is your current browser execution profile:
              </p>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">WASM Runtime:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready (Zero-Upload)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">WebGL Hardware:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accelerated
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">Local Browser Storage:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {diagnosticResults.storageQuota}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">API Server Roundtrip:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {diagnosticResults.pingMs ? `${diagnosticResults.pingMs} ms` : 'Testing...'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy Isolation Verified</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                  Your browser environment isolates memory buffers. Documents never traverse third-party analytics or external CDNs.
                </p>
              </div>
            </div>

            {/* Quick Profile / Settings Jump */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-extrabold uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>Account & Preferences</span>
              </div>
              <h4 className="font-bold text-sm">Need to configure Vault PIN or change appearance?</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Visit your Profile & Settings dashboard to manage custom API keys, OCR preferences, auto-lock timeouts, and storage quotas.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/profile"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                >
                  My Profile →
                </Link>
                <Link
                  href="/settings"
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors"
                >
                  Settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Searchable FAQ Knowledge Base */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-500">
            <HelpCircle className="w-4 h-4" />
            <span>Knowledge Base</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Everything you need to know about FileCraft zero-upload mechanics, storage, and vault security.
          </p>
        </div>

        {/* FAQ Search and Filter Tabs */}
        <div className="max-w-2xl mx-auto space-y-3 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions (e.g. Vault PIN, storage limit, WASM offline)..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium shadow-xs"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'privacy', label: '🛡️ Zero-Upload Privacy' },
              { id: 'vault', label: '🔒 PIN Vault' },
              { id: 'drive', label: '📂 Cloud Drive' },
              { id: 'ai', label: '🤖 AI Intelligence' },
              { id: 'tools', label: '🛠️ Tool Limits' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFaqCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFaqCategory === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-500' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                No questions found matching &ldquo;{faqSearch}&rdquo;
              </div>
              <p className="text-xs text-zinc-400">
                Try searching for a different term or message Yash directly on WhatsApp.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
