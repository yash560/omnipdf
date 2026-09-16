'use client';

import React, { useState } from 'react';
import { DriveItem, CollaboratorRole } from '@/lib/drive/drive-types';
import { addCollaboratorApi, removeCollaboratorApi, updateShareConfigApi } from '@/lib/drive/cloud-api';
import { 
  X, 
  Share2, 
  Users, 
  Link2, 
  Copy, 
  Check, 
  Shield, 
  Clock, 
  Download, 
  Eye, 
  Lock, 
  Trash2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface DriveShareModalProps {
  item: DriveItem | null;
  onClose: () => void;
  onItemUpdated: (updatedItem: DriveItem) => void;
}

export function DriveShareModal({ item, onClose, onItemUpdated }: DriveShareModalProps) {
  useBodyScrollLock(!!item);
  const [activeTab, setActiveTab] = useState<'team' | 'link'>('team');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Public link settings
  const [isPublic, setIsPublic] = useState(item?.shareConfig?.isPublic || false);
  const [allowDownload, setAllowDownload] = useState(item?.shareConfig?.allowDownload !== false);
  const [hasPassword, setHasPassword] = useState(item?.shareConfig?.hasPassword || false);
  const [password, setPassword] = useState('');
  const [expiryHours, setExpiryHours] = useState<number | null>(null);

  if (!item) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://filecraft.thewebvale.com'}/share/${item.shareConfig?.publicId || item.id}`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await addCollaboratorApi(item.id, inviteEmail.trim(), inviteRole);
      onItemUpdated(updated);
      setInviteEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    try {
      const updated = await removeCollaboratorApi(item.id, email);
      onItemUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator');
    }
  };

  const handleTogglePublic = async () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    setError(null);
    try {
      const expiresAt = expiryHours ? Date.now() + expiryHours * 3600 * 1000 : (item.shareConfig?.expiresAt || null);
      const updated = await updateShareConfigApi(item.id, {
        isPublic: nextPublic,
        allowDownload,
        hasPassword,
        passwordHash: password ? password : item.shareConfig?.passwordHash,
        expiresAt,
      });
      onItemUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update share link status');
      setIsPublic(!nextPublic);
    }
  };

  const handleSavePublicSettings = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const expiresAt = expiryHours ? Date.now() + expiryHours * 3600 * 1000 : (item.shareConfig?.expiresAt || null);
      const updated = await updateShareConfigApi(item.id, {
        isPublic,
        allowDownload,
        hasPassword,
        passwordHash: password ? password : (hasPassword ? item.shareConfig?.passwordHash : undefined),
        expiresAt,
      });
      onItemUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update share settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!isPublic) {
      setIsPublic(true);
      try {
        const expiresAt = expiryHours ? Date.now() + expiryHours * 3600 * 1000 : null;
        const updated = await updateShareConfigApi(item.id, {
          isPublic: true,
          allowDownload,
          hasPassword,
          passwordHash: password ? password : undefined,
          expiresAt,
        });
        onItemUpdated(updated);
      } catch (err: any) {
        console.error('Failed to auto-enable public link:', err);
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-modal-backdrop">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Share & Collaborate
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md font-mono">
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 pt-3 gap-6 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'team'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Direct Team Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Public & Password Link</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-5">
              {/* Invite Form */}
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter colleague or team email..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                  className="px-3 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor (Can Upload/Edit)</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
                >
                  Invite
                </button>
              </form>

              {/* Existing Collaborators List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  People with Access ({item.sharedWith?.length || 0})
                </h4>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {/* Owner */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
                        {(item.ownerName || 'O')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {item.ownerName || 'Owner'} <span className="text-zinc-400 font-normal font-mono">({item.ownerEmail || 'owner'})</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-semibold">Document Owner</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold">
                      Owner
                    </span>
                  </div>

                  {/* Collaborators */}
                  {(item.sharedWith || []).map((collab) => (
                    <div key={collab.email} className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-xs flex items-center justify-center">
                          {collab.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {collab.name} <span className="text-zinc-400 font-normal font-mono">({collab.email})</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 capitalize">{collab.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold capitalize">
                          {collab.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collab.email)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Remove Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Toggle Public Link */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Public Share Link
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Anyone with the link can view or download this file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isPublic ? 'bg-rose-500' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isPublic && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Share Link Box */}
                  <div className="flex items-center gap-2 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-transparent px-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Allow Download */}
                    <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-blue-500" /> Allow Download
                        </span>
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="rounded-sm accent-rose-500"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {allowDownload ? 'Visitors can download the original file' : 'View-only mode (watermark protected)'}
                      </p>
                    </div>

                    {/* Expiration */}
                    <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Link Expiry
                      </span>
                      <select
                        value={expiryHours === null ? 'never' : expiryHours.toString()}
                        onChange={(e) => setExpiryHours(e.target.value === 'never' ? null : parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-bold"
                      >
                        <option value="never">Never Expires</option>
                        <option value="1">1 Hour</option>
                        <option value="24">24 Hours</option>
                        <option value="168">7 Days</option>
                        <option value="720">30 Days</option>
                      </select>
                    </div>

                    {/* Password Protection */}
                    <div className="sm:col-span-2 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-500" /> Password Protection
                        </span>
                        <input
                          type="checkbox"
                          checked={hasPassword}
                          onChange={(e) => setHasPassword(e.target.checked)}
                          className="rounded-sm accent-rose-500"
                        />
                      </div>
                      {hasPassword && (
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Set link access password..."
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePublicSettings}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Settings Saved!</span>
                      </>
                    ) : (
                      <span>Save Public Link Settings</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
