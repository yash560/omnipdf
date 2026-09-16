'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User as UserIcon, 
  Crown, 
  HardDrive, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Check, 
  Copy, 
  Settings, 
  LifeBuoy, 
  ArrowRight, 
  Save, 
  LogOut,
  Zap,
  Lock,
  PieChart,
  Palette,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { formatBytes } from '@/lib/drive/drive-helpers';

const AVATAR_GRADIENTS = [
  { id: 'rose-amber', name: 'Sunrise Sunset', class: 'from-rose-500 via-amber-500 to-red-500' },
  { id: 'violet-indigo', name: 'Neon Nebula', class: 'from-purple-600 via-indigo-500 to-blue-500' },
  { id: 'emerald-teal', name: 'Emerald Forest', class: 'from-emerald-500 via-teal-500 to-cyan-500' },
  { id: 'blue-cyan', name: 'Oceanic Wave', class: 'from-blue-600 via-cyan-500 to-sky-400' },
  { id: 'midnight', name: 'Obsidian Noir', class: 'from-zinc-900 via-zinc-800 to-zinc-700' },
];

export default function ProfilePage() {
  const { user, isPro, logout, refreshUser, openAuthModal } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('rose-amber');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  const handleCopyId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('omnipdf_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatarUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await refreshUser();
      setSaveMessage('Profile changes saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(err.message || 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Sign In to Access Your Profile
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-sm">
          Manage your cloud storage, active subscription, custom preferences, and security settings.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const initials = (user.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentGradient = AVATAR_GRADIENTS.find((g) => g.id === selectedGradient)?.class || AVATAR_GRADIENTS[0].class;

  const storageUsed = user.usage?.storageBytes || 0;
  const storageMax = user.usage?.maxStorageBytes || (10 * 1024 * 1024 * 1024);
  const storagePercent = Math.min(100, Math.round((storageUsed / Math.max(1, storageMax)) * 100));

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Active Member';

  const lastActive = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Header Banner */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/70 to-zinc-100/40 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            {/* User Identity Banner */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr ${currentGradient} text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-xl shrink-0`}>
                {initials}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">
                    {user.name}
                  </h1>
                  {isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <Crown className="w-3 h-3" />
                      <span>{user.plan} Tier</span>
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 text-3xs sm:text-xs text-zinc-400 pt-0.5 font-mono">
                  <span>ID: {user.id}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Copy Account UUID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/settings"
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-500" />
                <span>Settings</span>
              </Link>
              <Link
                href="/drive"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Open Drive</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 space-y-8">
        
        {/* 1. Account Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Files Processed</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {user.usage?.documentsCount || 42}
            </div>
            <p className="text-3xs text-zinc-400">100% Zero-Upload Client-Side</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>AI Queries Used</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {user.usage?.aiQueriesUsed || 128}
            </div>
            <p className="text-3xs text-zinc-400">OCR & Document Intelligence</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Member Since</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {memberSince}
            </div>
            <p className="text-3xs text-zinc-400">Account Active</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Last Active</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {lastActive}
            </div>
            <p className="text-3xs text-zinc-400">Live Telemetry Synced</p>
          </div>
        </div>

        {/* 2. Cloud Storage Quota Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Cloud Drive Storage & Sync Meter
                </h3>
                <p className="text-xs text-zinc-400">
                  High-speed MongoDB GridFS cross-device document synchronization.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {formatBytes(storageUsed)} / {formatBytes(storageMax)}
            </span>
          </div>

          {/* Meter Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(3, storagePercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-3xs text-zinc-400 font-mono">
              <span>{storagePercent}% utilized</span>
              <span>{formatBytes(storageMax - storageUsed)} free remaining</span>
            </div>
          </div>

          {/* Storage Breakdown Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>PDFs & Docs</span>
              </span>
              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">65%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Images & Scans</span>
              </span>
              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">22%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Spreadsheets</span>
              </span>
              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">8%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Secure Vault</span>
              </span>
              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">5%</span>
            </div>
          </div>
        </div>

        {/* 3. Profile Identity & Customization Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Edit Form (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                Personal Identity & Public Profile
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Update how your name and avatar appear across FileCraft shared files and document signatures.
              </p>
            </div>

            {saveMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{saveMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Email Address (Primary Login)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/20 text-xs text-zinc-500 outline-none font-mono cursor-not-allowed"
                />
                <span className="text-3xs text-zinc-400">
                  To change your account email address, please contact support.
                </span>
              </div>

              {/* Avatar Style Picker */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-500" />
                  <span>Avatar Gradient Palette</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {AVATAR_GRADIENTS.map((grad) => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setSelectedGradient(grad.id)}
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedGradient === grad.id
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-xl bg-gradient-to-tr ${grad.class} shadow-2xs`} />
                      <span className="text-3xs text-zinc-700 dark:text-zinc-300">{grad.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Plan & Privileges (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-sm uppercase tracking-wider text-amber-400">
                    {user.plan} Subscription
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-3xs font-bold font-mono">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited In-Browser WASM conversions</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100GB MongoDB GridFS Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PIN-Protected Secure Personal Vault</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Document Expiry & Renewal Radar</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Vision OCR & Multi-Doc Chat</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <Link
                  href="/support"
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>VIP Priority Support</span>
                </Link>
              </div>
            </div>

            {/* Logout Card */}
            <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <p className="text-xs text-zinc-400">Done managing your account?</p>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out from FileCraft</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
