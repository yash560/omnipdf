'use client';

import React, { useState, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { useAI } from '@/lib/ai/ai-context';
import { FOLDER_COLORS, DriveFolderColor, DriveComment, DriveActivity } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo, getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import { fetchDriveCommentsApi, addDriveCommentApi, fetchDriveActivitiesApi } from '@/lib/drive/cloud-api';
import {
  X,
  Sparkles,
  Palette,
  Folder,
  FileText,
  ExternalLink,
  Bot,
  Users,
  Share2,
  MessageSquare,
  History,
  Send,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { DriveRelatedItems } from './DriveRelatedItems';
import { DriveThumbnail } from './DriveThumbnail';

export function DriveDetailsDrawer() {
  const { detailsItem, setDetailsItem, changeFolderColor, openShareModal, openQuickTools, openFolderChat } = useDrive();
  const { openDrawer, setActiveFile } = useAI();

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  const [comments, setComments] = useState<DriveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [activities, setActivities] = useState<DriveActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!detailsItem) return;

    if (activeTab === 'comments') {
      fetchDriveCommentsApi(detailsItem.id).then(setComments);
    } else if (activeTab === 'activity') {
      setLoadingActivity(true);
      fetchDriveActivitiesApi(detailsItem.id)
        .then(setActivities)
        .finally(() => setLoadingActivity(false));
    }
  }, [detailsItem, activeTab]);

  if (!detailsItem) return null;

  const isFolder = detailsItem.type === 'folder';
  const tools = getFileCraftToolsForItem(detailsItem);

  const handleAskAI = () => {
    setActiveFile({
      name: detailsItem.name,
      size: detailsItem.size,
    });
    openDrawer();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const added = await addDriveCommentApi(detailsItem.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        onClick={() => setDetailsItem(null)}
      />

      <aside className="fixed lg:static top-0 right-0 bottom-0 z-50 lg:z-auto w-[300px] sm:w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex flex-col justify-between overflow-hidden shadow-2xl lg:shadow-none animate-in slide-in-from-right lg:animate-none duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsItem(null)}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'details' && (
          <div className="space-y-5">
            {/* Thumbnail / Icon Preview & Title */}
            <div className="text-center space-y-2.5">
              {!isFolder ? (
                <div className="w-full aspect-[16/10] rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                  <DriveThumbnail item={detailsItem} view="column" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Folder className="w-6 h-6 text-amber-500" />
                </div>
              )}
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate px-2">
                {detailsItem.name}
              </h4>
              <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono uppercase text-zinc-500 font-bold">
                {detailsItem.category}
              </span>
            </div>

            {/* Sharing Bar */}
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sharing & Team</span>
                </span>
                <button
                  type="button"
                  onClick={() => openShareModal(detailsItem)}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {detailsItem.sharedWith?.length 
                  ? `${detailsItem.sharedWith.length} active team collaborator(s)` 
                  : 'Private to you. Invite colleagues by email or create public links.'}
              </p>
            </div>

            {/* AI Copilot Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-cyan-500/10 border border-rose-500/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {isFolder ? 'Folder AI Multi-Doc RAG' : 'TheWebVale AI File Intelligence'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {isFolder 
                  ? 'Ask questions, summarize documents, or extract renewal dates across this folder.' 
                  : 'Instantly extract structured metrics, formulas, or audit clauses.'}
              </p>
              <button
                type="button"
                onClick={isFolder ? () => openFolderChat(detailsItem) : handleAskAI}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isFolder ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                <span>{isFolder ? 'Chat with this Folder' : 'Chat with this File'}</span>
              </button>
            </div>


            {/* Folder Color Picker */}
            {isFolder && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <Palette className="w-3.5 h-3.5 text-purple-500" />
                  <span>Folder Color</span>
                </div>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {(Object.keys(FOLDER_COLORS) as DriveFolderColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => changeFolderColor(detailsItem.id, c)}
                      title={FOLDER_COLORS[c].label}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                        detailsItem.color === c ? 'ring-2 ring-rose-500 ring-offset-2' : 'border-white dark:border-zinc-800'
                      }`}
                      style={{ backgroundColor: FOLDER_COLORS[c].hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Properties
              </div>
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Size:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                    {isFolder ? '—' : formatBytes(detailsItem.size)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Format:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[140px]">
                    {isFolder ? 'Folder' : (detailsItem.extension ? `${detailsItem.extension.toUpperCase()} Document` : detailsItem.category.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Modified:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                    {formatTimeAgo(detailsItem.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Items Recommendations */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <DriveRelatedItems item={detailsItem} />
            </div>

            {/* Tool Shortcuts */}
            {!isFolder && (
              <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Quick Actions
                </div>

                <button
                  type="button"
                  onClick={() => openQuickTools(detailsItem)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      {detailsItem.category === 'image'
                        ? 'Crop, Resize & Adjust'
                        : detailsItem.category === 'pdf'
                        ? 'Rotate, Split & Watermark'
                        : detailsItem.category === 'spreadsheet'
                        ? 'Clean & Convert Data'
                        : detailsItem.category === 'code' || detailsItem.category === 'document'
                        ? 'Edit & Format Code'
                        : detailsItem.category === 'media'
                        ? 'Trim & Cut Media'
                        : detailsItem.category === 'archive'
                        ? 'Extract to Drive Folder'
                        : 'Open In-Place Tools'}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {tools.slice(0, 2).map((t, idx) => (
                  <Link
                    key={idx}
                    href={t.href}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 hover:bg-rose-50/40 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <span>{t.label}</span>
                    <ExternalLink className="w-3 h-3 text-rose-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Comments */}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No comments yet. Start a team discussion on this file!
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{c.userName}</span>
                      <span className="text-[9px] text-zinc-400">{formatTimeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-1.5 pt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a note..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="p-2 rounded-xl bg-rose-500 text-white disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: History Audit Log */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {loadingActivity ? (
              <div className="text-center py-6 text-xs text-zinc-400">Loading audit history...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">No activity recorded yet.</div>
            ) : (
              <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {activities.map((a) => (
                  <div key={a.id} className="pt-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200">
                      <span className="capitalize">{a.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">{formatTimeAgo(a.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">{a.userName} {a.details ? `• ${a.details}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 text-center font-mono shrink-0">
        ID: {detailsItem.id}
      </div>
    </aside>
    </>
  );
}

