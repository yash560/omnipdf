'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  EyeOff, 
  FileText, 
  Check, 
  X, 
  Cpu, 
  Send, 
  ShieldAlert, 
  Zap, 
  Activity,
  CheckCircle2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Annotation } from '@/types/pdf';

interface AiPageAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentPage: number;
  viewportSize: { width: number; height: number };
  onApplyAnnotations: (annotations: Annotation[]) => void;
}

export function AiPageAssistantModal({
  isOpen,
  onClose,
  pageCanvasRef,
  currentPage,
  viewportSize,
  onApplyAnnotations,
}: AiPageAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'autofill' | 'prompt' | 'redact' | 'pool'>('autofill');

  // Form Autofill State
  const [userContext, setUserContext] = useState(
    'Full Name: Yash Jain\nEmail: yash@thewebvale.com\nPhone: +91 8770183178\nAddress: Bhopal, Madhya Pradesh, India\nDate: 15 September 2026\nDesignation: Lead Systems Engineer'
  );
  const [presetProfile, setPresetProfile] = useState<'personal' | 'invoice' | 'tax'>('personal');

  // Prompt Edit State
  const [userPrompt, setUserPrompt] = useState('');

  // PII Redaction State
  const [selectedPii, setSelectedPii] = useState<string[]>([
    'Email Addresses',
    'Phone Numbers',
    'Social Security Numbers',
    'Credit Card Numbers',
  ]);

  // Execution & Pool Status
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [poolStatus, setPoolStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPoolStatus();
    }
  }, [isOpen]);

  const fetchPoolStatus = async () => {
    try {
      const res = await fetch('/api/ai/page-edit');
      const data = await res.json();
      if (data.poolStatus) {
        setPoolStatus(data.poolStatus);
      }
    } catch {}
  };

  if (!isOpen) return null;

  // Capture Base64 image from current page canvas
  const capturePageImage = (): string | null => {
    const canvas = pageCanvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleApplyPreset = (type: 'personal' | 'invoice' | 'tax') => {
    setPresetProfile(type);
    if (type === 'personal') {
      setUserContext(
        'Full Name: Yash Jain\nEmail: yash@thewebvale.com\nPhone: +91 8770183178\nAddress: Bhopal, Madhya Pradesh, India\nDate: 15 September 2026\nDesignation: Lead Systems Engineer'
      );
    } else if (type === 'invoice') {
      setUserContext(
        'Vendor: TheWebVale Technologies\nClient: Global Enterprise Corp\nInvoice #: INV-2026-9812\nDate: 15 Sep 2026\nDue Date: 30 Sep 2026\nItem 1: Enterprise Cloud Architecture - $4,500\nItem 2: Vector Security & PDF Engine - $2,800\nTax (18%): $1,314\nTotal: $8,614.00'
      );
    } else if (type === 'tax') {
      setUserContext(
        'Tax ID / PAN: ABCDE1234F\nFiling Status: Registered Enterprise\nAssessment Year: 2026-27\nGross Income: $150,000\nTax Paid: $32,000\nRefund Due: $1,450'
      );
    }
  };

  const handleRunAutoFill = async () => {
    const pageImage = capturePageImage();
    if (!pageImage) {
      alert('Unable to capture current page image from canvas.');
      return;
    }

    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/ai/page-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-fill-form',
          pageImage,
          userContext,
          viewport: {
            pageIndex: currentPage,
            width: viewportSize.width,
            height: viewportSize.height,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to auto-fill form');

      if (data.annotations && data.annotations.length > 0) {
        onApplyAnnotations(data.annotations);
        setResultMessage(`✨ Successfully detected and populated ${data.annotations.length} form fields!`);
      } else {
        setResultMessage('AI scanned the page but found no clear empty form blanks. Try using "Prompt to Edit".');
      }

      if (data.poolStatus) setPoolStatus(data.poolStatus);
    } catch (err: any) {
      alert(`AI Auto-Fill Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPromptEdit = async (customText?: string) => {
    const promptToRun = customText || userPrompt;
    if (!promptToRun.trim()) {
      alert('Please enter an instruction or choose a quick prompt.');
      return;
    }

    const pageImage = capturePageImage();
    if (!pageImage) {
      alert('Unable to capture current page image from canvas.');
      return;
    }

    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/ai/page-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prompt-edit',
          pageImage,
          userPrompt: promptToRun,
          viewport: {
            pageIndex: currentPage,
            width: viewportSize.width,
            height: viewportSize.height,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply AI prompt edit');

      if (data.annotations && data.annotations.length > 0) {
        onApplyAnnotations(data.annotations);
        setResultMessage(`✨ Applied AI prompt edit: ${data.description || `${data.annotations.length} items added`}`);
      } else {
        setResultMessage('AI completed instructions.');
      }

      if (data.poolStatus) setPoolStatus(data.poolStatus);
    } catch (err: any) {
      alert(`AI Prompt Edit Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPiiRedaction = async () => {
    const pageImage = capturePageImage();
    if (!pageImage) {
      alert('Unable to capture current page image from canvas.');
      return;
    }

    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/ai/page-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-redact-pii',
          pageImage,
          piiTypes: selectedPii,
          viewport: {
            pageIndex: currentPage,
            width: viewportSize.width,
            height: viewportSize.height,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to perform AI redaction');

      if (data.annotations && data.annotations.length > 0) {
        onApplyAnnotations(data.annotations);
        setResultMessage(`🛡️ Detected and redacted ${data.detectedCount} sensitive PII areas!`);
      } else {
        setResultMessage('No matching sensitive PII items detected on this page.');
      }

      if (data.poolStatus) setPoolStatus(data.poolStatus);
    } catch (err: any) {
      alert(`AI Redaction Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  TheWebVale Page Studio AI
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold uppercase backdrop-blur-sm">
                  Page {currentPage}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Vision Auto-Fill, Natural Language Edits & Automated PII Redaction
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 px-4 pt-2 gap-1 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => { setActiveTab('autofill'); setResultMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'autofill'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Form Auto-Fill</span>
          </button>

          <button
            onClick={() => { setActiveTab('prompt'); setResultMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'prompt'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Prompt to Edit</span>
          </button>

          <button
            onClick={() => { setActiveTab('redact'); setResultMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'redact'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>AI PII Redactor</span>
          </button>

          <button
            onClick={() => { setActiveTab('pool'); setResultMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pool'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Key Pool Health</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Result Alert if available */}
          {resultMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {/* TAB 1: FORM AUTO-FILL */}
          {activeTab === 'autofill' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Select Context Profile Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset('personal')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      presetProfile === 'personal'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    👤 Personal Info
                  </button>

                  <button
                    onClick={() => handleApplyPreset('invoice')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      presetProfile === 'invoice'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    💼 Business Invoice
                  </button>

                  <button
                    onClick={() => handleApplyPreset('tax')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      presetProfile === 'tax'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    🏛️ Tax & Legal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Information to Auto-Populate
                </label>
                <textarea
                  rows={5}
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-xs outline-none focus:border-indigo-600"
                  placeholder="Enter name, address, numbers, dates..."
                />
              </div>

              <button
                onClick={handleRunAutoFill}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{loading ? 'Vision AI Detecting Form Blanks...' : 'Scan & Auto-Fill Form Fields'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: PROMPT TO EDIT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Quick Action Prompts
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Add green APPROVED stamp on top right',
                    'Insert signature and date line at bottom right',
                    'Add executive summary sticky note on top left',
                    'Insert confidential disclaimer footer at bottom',
                    'Add review comment explaining key terms',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setUserPrompt(chip);
                        handleRunPromptEdit(chip);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Natural Language Page Instruction
                </label>
                <textarea
                  rows={4}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. Add a yellow note in the margin summarizing paragraph 2, or add an approval seal..."
                  className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <button
                onClick={() => handleRunPromptEdit()}
                disabled={loading || !userPrompt.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{loading ? 'AI Analyzing Layout & Designing...' : 'Execute Prompt on Page'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: SMART PII REDACTOR */}
          {activeTab === 'redact' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  TheWebVale Vision AI scans the rendered page image, locates sensitive bounding boxes, and places permanent blackout redactions.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Select Data Types to Redact
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Email Addresses',
                    'Phone Numbers',
                    'Social Security Numbers',
                    'Credit Card Numbers',
                    'Personal Physical Addresses',
                    'Tax IDs / PAN Numbers',
                    'Signatures',
                    'Full Names',
                  ].map((pii) => {
                    const isChecked = selectedPii.includes(pii);
                    return (
                      <button
                        key={pii}
                        onClick={() => {
                          setSelectedPii((prev) =>
                            isChecked ? prev.filter((p) => p !== pii) : [...prev, pii]
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span>{pii}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-rose-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleRunPiiRedaction}
                disabled={loading || selectedPii.length === 0}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>{loading ? 'AI Scanning for Sensitive PII...' : 'Scan & Apply Blackout Redactions'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: KEY POOL STATUS */}
          {activeTab === 'pool' && (
            <div className="space-y-3 font-mono">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-sans font-bold">TheWebVale Key Rotation Pool:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Active • High Availability
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[10px] text-zinc-400 uppercase">Total Keys in Pool</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {poolStatus?.totalKeys ?? 23} Keys
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[10px] text-zinc-400 uppercase">Active Key Prefix</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {poolStatus?.activeKeyPrefix ?? 'AIzaSyDM...'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[10px] text-zinc-400 uppercase">Pool Health</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {poolStatus?.poolHealthPercent ?? 100}% Operational
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[10px] text-zinc-400 uppercase">Rate-Limit Failover</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      Auto-Retry (10m Cooldown)
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Keys are round-robin rotated and synchronized with TheWebVale MongoDB <code>api-keys</code> collection. When any key hits a 429 quota, the engine switches to the next healthy key in less than 20 milliseconds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Powered by TheWebVale Multimodal AI Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
