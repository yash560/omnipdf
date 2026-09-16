'use client';

import React from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface DriveKeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriveKeyboardShortcutsModal: React.FC<DriveKeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation & Selection',
      shortcuts: [
        { keys: ['↑', '↓', '←', '→'], description: 'Navigate files & folders' },
        { keys: ['Space'], description: 'Quick Look in-browser preview' },
        { keys: ['Enter'], description: 'Open selected folder or file' },
        { keys: ['Cmd', 'A'], description: 'Select all items in current view' },
        { keys: ['Esc'], description: 'Deselect all / Close modal or drawer' },
      ],
    },
    {
      title: 'Actions & Management',
      shortcuts: [
        { keys: ['Cmd', 'K'], description: 'Focus smart search bar' },
        { keys: ['U'], description: 'Smart Upload & Document Scanner Studio' },
        { keys: ['Delete'], description: 'Move selected items to Trash' },
        { keys: ['Cmd', 'Shift', 'N'], description: 'Create new folder' },
        { keys: ['?'], description: 'Open this keyboard shortcuts guide' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Keyboard Shortcuts</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Master FileCraft Drive with pro hotkeys</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-6">
          {shortcutGroups.map((grp, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{grp.title}</h4>
              <div className="space-y-2.5">
                {grp.shortcuts.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-3xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-sm"
                        >
                          {k === 'Cmd' ? <Command className="w-3 h-3 inline" /> : k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
