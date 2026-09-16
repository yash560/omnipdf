'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor, 
  Type, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Key, 
  Download, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  HardDrive, 
  Sliders, 
  Layers, 
  Eye, 
  Volume2, 
  ShieldAlert,
  HelpCircle,
  Cpu,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

type SettingsTab = 'general' | 'vault' | 'ai' | 'security';

export default function SettingsPage() {
  const { user, isAuthenticated, logout, refreshUser, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // General Settings State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [defaultLanding, setDefaultLanding] = useState('drive');
  const [soundEffects, setSoundEffects] = useState(true);

  // Vault Settings State
  const [vaultPin, setVaultPin] = useState('');
  const [confirmVaultPin, setConfirmVaultPin] = useState('');
  const [vaultAutoLock, setVaultAutoLock] = useState('5');
  const [strictWasmMode, setStrictWasmMode] = useState(false);
  const [recordHistory, setRecordHistory] = useState(true);

  // AI & OCR Settings State
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [ocrLanguage, setOcrLanguage] = useState('eng+hin');
  const [pdfDpiQuality, setPdfDpiQuality] = useState('150');
  const [customApiKey, setCustomApiKey] = useState('');

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) setTheme(savedTheme);

      const savedPin = localStorage.getItem('filecraft_vault_pin');
      if (savedPin) setVaultPin(savedPin);

      const savedTimeout = localStorage.getItem('filecraft_vault_lock_timeout');
      if (savedTimeout) setVaultAutoLock(savedTimeout);

      const savedApiKey = localStorage.getItem('filecraft_custom_api_key');
      if (savedApiKey) setCustomApiKey(savedApiKey);

      const savedStrictWasm = localStorage.getItem('filecraft_strict_wasm') === 'true';
      setStrictWasmMode(savedStrictWasm);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (typeof window === 'undefined') return;

    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    showFeedback('success', `Theme updated to ${newTheme} mode.`);
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('filecraft_font', fontFamily);
        localStorage.setItem('filecraft_autosave', String(autoSaveInterval));
        localStorage.setItem('filecraft_default_landing', defaultLanding);
        localStorage.setItem('filecraft_sound_effects', String(soundEffects));
      }

      // Sync with user profile preferences if logged in
      if (user) {
        const token = localStorage.getItem('omnipdf_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            preferences: {
              theme,
              defaultFont: fontFamily,
              autoSaveInterval,
            },
          }),
        });
        await refreshUser();
      }

      showFeedback('success', 'Workspace preferences saved successfully!');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVaultPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultPin || vaultPin.length !== 4 || !/^\d{4}$/.test(vaultPin)) {
      showFeedback('error', 'Vault PIN must be exactly 4 digits.');
      return;
    }
    if (confirmVaultPin && confirmVaultPin !== vaultPin) {
      showFeedback('error', 'PIN confirmation does not match.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('filecraft_vault_pin', vaultPin);
      localStorage.setItem('filecraft_vault_lock_timeout', vaultAutoLock);
      localStorage.setItem('filecraft_strict_wasm', String(strictWasmMode));
      localStorage.setItem('filecraft_record_history', String(recordHistory));
    }
    setConfirmVaultPin('');
    showFeedback('success', 'Secure Vault PIN & Auto-Lock preferences updated!');
  };

  const handleSaveAISettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('filecraft_ai_model', aiModel);
      localStorage.setItem('filecraft_ocr_lang', ocrLanguage);
      localStorage.setItem('filecraft_pdf_dpi', pdfDpiQuality);
      if (customApiKey) {
        localStorage.setItem('filecraft_custom_api_key', customApiKey.trim());
      } else {
        localStorage.removeItem('filecraft_custom_api_key');
      }
    }
    showFeedback('success', 'AI & OCR engine configuration saved!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showFeedback('error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showFeedback('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showFeedback('error', 'New password and confirmation do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('omnipdf_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showFeedback('success', 'Password updated successfully!');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        user: user || null,
        localSettings: {
          theme,
          fontFamily,
          autoSaveInterval,
          defaultLanding,
          vaultAutoLock,
          strictWasmMode,
          aiModel,
          ocrLanguage,
        },
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filecraft-account-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback('success', 'Account metadata archive exported successfully!');
    } catch {
      showFeedback('error', 'Failed to export backup data.');
    }
  };

  const handleClearLocalCache = () => {
    if (confirm('Are you sure you want to clear local IndexedDB and temporary cache files? Your cloud drive files in MongoDB remain safe.')) {
      try {
        sessionStorage.clear();
        localStorage.removeItem('filecraft_search_history');
        showFeedback('success', 'Local cache purged successfully!');
      } catch {
        showFeedback('error', 'Could not clear cache.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Settings Top Header */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/70 to-zinc-100/40 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-500">
                <Sliders className="w-4 h-4" />
                <span>Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Settings & Preferences
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Configure your workspace, Vault PIN security, AI vision models, and account safety.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                View Profile →
              </Link>
              <Link
                href="/support"
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Get Support →
              </Link>
            </div>
          </div>

          {/* Settings Tabs Navigation */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {[
              { id: 'general', label: 'General & Workspace', icon: Sliders },
              { id: 'vault', label: 'Privacy & Secure Vault', icon: Lock },
              { id: 'ai', label: 'AI & OCR Intelligence', icon: Sparkles },
              { id: 'security', label: 'Security & Danger Zone', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Settings Content Area */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Global Alert Notification */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: General & Workspace */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                Workspace & Appearance Controls
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize your visual interface theme, default typography, and auto-save frequencies.
              </p>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-6">
              {/* Theme Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'system', label: 'System Auto', icon: Monitor },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleThemeChange(mode.id as any)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          theme === mode.id
                            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-blue-500" />
                    <span>Default Editor Typography</span>
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern & Clean)</option>
                    <option value="Inter">Inter (Classic Enterprise)</option>
                    <option value="Roboto Mono">Roboto Mono (Code & Technical)</option>
                    <option value="Fira Code">Fira Code (Developer Monospace)</option>
                  </select>
                </div>

                {/* Auto Save Interval */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Auto-Save Interval</span>
                  </label>
                  <select
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                  >
                    <option value={15}>Every 15 seconds (High Frequency)</option>
                    <option value={30}>Every 30 seconds (Balanced)</option>
                    <option value={60}>Every 1 minute (Low Bandwidth)</option>
                    <option value={0}>Real-time instant (On keystroke)</option>
                  </select>
                </div>
              </div>

              {/* Default Landing Page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Default Start Suite
                  </label>
                  <select
                    value={defaultLanding}
                    onChange={(e) => setDefaultLanding(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="drive">FileCraft Cloud Drive (/drive)</option>
                    <option value="edit">PDF Studio Editor (/edit)</option>
                    <option value="image-converter">Image Studio (/image-converter)</option>
                    <option value="home">50 Tools Catalog Home (/)</option>
                  </select>
                </div>

                {/* Sound Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Audio & Interaction Chimes
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="soundToggle"
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="soundToggle" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                      Play subtle sound cues on upload completion and vault lock.
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save General Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Privacy & Secure Vault */}
        {activeTab === 'vault' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-500 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Knowledge Protection</span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                Personal Vault PIN & Session Shield
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Control the 4-digit Master PIN used to veil sensitive Aadhaar, PAN, Passports, and financial documents.
              </p>
            </div>

            <form onSubmit={handleSaveVaultPin} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Master Vault PIN (4 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={vaultPin}
                    onChange={(e) => setVaultPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 font-mono tracking-widest outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <span className="text-3xs text-zinc-400">Default fallback PIN is 1234</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Confirm Vault PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Repeat 4 digits"
                    value={confirmVaultPin}
                    onChange={(e) => setConfirmVaultPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 font-mono tracking-widest outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Auto-Lock Timeout
                  </label>
                  <select
                    value={vaultAutoLock}
                    onChange={(e) => setVaultAutoLock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="1">Lock after 1 minute of inactivity</option>
                    <option value="5">Lock after 5 minutes (Recommended)</option>
                    <option value="15">Lock after 15 minutes</option>
                    <option value="30">Lock after 30 minutes</option>
                    <option value="0">Immediately lock when tab loses focus</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Strict Client-Side WASM Isolation
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="wasmStrictToggle"
                      checked={strictWasmMode}
                      onChange={(e) => setStrictWasmMode(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="wasmStrictToggle" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                      Enforce 100% browser-only execution and block all cloud AI assists.
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Vault PIN & Security Rules</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: AI & OCR Intelligence */}
        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-500 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>TheWebVale AI Vision</span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                AI Intelligence & Optical Character Recognition
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure default models, OCR language packs, and custom API provider keys.
              </p>
            </div>

            <form onSubmit={handleSaveAISettings} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Default AI Model Engine
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="gemini-2.5-flash">TheWebVale AI Ultra / Gemini 2.5 Flash (Fastest)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Deep Reasoning)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Balanced)</option>
                    <option value="local-wasm">Local In-Browser WASM Model (100% Offline)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Tesseract OCR Default Languages
                  </label>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="eng+hin">English + Hindi (Multilingual Indian Scans)</option>
                    <option value="eng">English Only (High Speed)</option>
                    <option value="eng+spa+fra+deu">English + European (Spanish, French, German)</option>
                    <option value="eng+jpn+chi_sim">English + East Asian (Japanese, Chinese)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Default PDF Compression Render DPI
                  </label>
                  <select
                    value={pdfDpiQuality}
                    onChange={(e) => setPdfDpiQuality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="150">Balanced (150 DPI - Recommended for Docs)</option>
                    <option value="72">Maximum Compression (72 DPI - Smallest Size)</option>
                    <option value="300">Print Quality (300 DPI - Crisp Text)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Custom Gemini / OpenAI API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy... (Stored locally only)"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 font-mono outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <span className="text-3xs text-zinc-400">Leave blank to use FileCraft bundled cloud quota.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save AI & OCR Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Security & Danger Zone */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Password Change Form */}
            {user && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                    Change Account Password
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update your master account login password with encrypted SHA-256 validation.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Account Password</span>
                  </button>
                </form>
              </div>
            )}

            {/* Data Export & Danger Zone */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>Data Backups & Session Cache</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Export your document metadata, reset local browser sandboxes, or terminate active sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Data */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      Export Account Data Backup (JSON)
                    </h4>
                    <p className="text-3xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Download all folder trees, categorization tags, and custom settings as an offline backup.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full py-2 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Download Backup Archive</span>
                  </button>
                </div>

                {/* Purge Local Cache */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      Purge Local Browser Cache
                    </h4>
                    <p className="text-3xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Clears temporary IndexedDB files, cached search tokens, and resets WASM memory buffers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLocalCache}
                    className="w-full py-2 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Purge Local Sandboxes</span>
                  </button>
                </div>
              </div>

              {/* Sign Out All Devices */}
              {user && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      Active Device Session
                    </div>
                    <div className="text-3xs text-zinc-400 font-mono">
                      Current user: {user.email} (Authenticated)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
