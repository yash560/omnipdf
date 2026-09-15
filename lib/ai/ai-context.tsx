'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AIPersonaId, ToolActionChip, AI_PERSONAS } from './ai-types';

export interface ActiveFileContext {
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  textContent?: string;
  imageBase64?: string;
}

export interface ActiveToolContext {
  slug: string;
  name: string;
  suite: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  activeFile: ActiveFileContext | null;
  setActiveFile: (file: ActiveFileContext | null) => void;
  activeTool: ActiveToolContext | null;
  setActiveTool: (tool: ActiveToolContext | null) => void;
  persona: AIPersonaId;
  setPersona: (persona: AIPersonaId) => void;
  messages: ChatMessageItem[];
  isLoading: boolean;
  sendMessage: (text: string, overridePersona?: AIPersonaId) => Promise<void>;
  triggerQuickAction: (chip: ToolActionChip) => Promise<void>;
  clearChat: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<ActiveFileContext | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveToolContext | null>(null);
  const [persona, setPersona] = useState<AIPersonaId>('general');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-switch default persona when tool suite changes
  useEffect(() => {
    if (activeTool?.suite) {
      if (activeTool.suite === 'image') setPersona('vision');
      else if (activeTool.suite === 'data') setPersona('analyst');
      else if (activeTool.suite === 'media' || activeTool.suite === 'pdf') setPersona('writer');
      else if (activeTool.suite === 'security' || activeTool.suite === 'archive') setPersona('dev');
      else setPersona('general');
    }
  }, [activeTool?.suite]);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearChat = useCallback(() => setMessages([]), []);

  const sendMessage = useCallback(
    async (text: string, overridePersona?: AIPersonaId) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessageItem = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      // Auto-open drawer if sending message
      setIsOpen(true);

      try {
        const payload = {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          fileContext: activeFile?.textContent,
          imageBase64: activeFile?.imageBase64,
          toolSlug: activeTool?.slug,
          suite: activeTool?.suite,
          personaId: overridePersona || persona,
        };

        const res = await fetch('/api/ai/universal-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to get AI response`);
        }

        const data = await res.json();
        const assistantMsg: ChatMessageItem = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.text || 'I analyzed your file, but no text was generated.',
          timestamp: new Date(),
        };

        setMessages([...updatedMessages, assistantMsg]);
      } catch (err: any) {
        console.error('[AIContext] Chat Error:', err);
        const errorMsg: ChatMessageItem = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error**: ${err.message || 'Something went wrong while connecting to the AI.'}\nPlease verify that your file context is valid and try again.`,
          timestamp: new Date(),
        };
        setMessages([...updatedMessages, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, activeFile, activeTool, persona, isLoading]
  );

  const triggerQuickAction = useCallback(
    async (chip: ToolActionChip) => {
      if (chip.persona) {
        setPersona(chip.persona);
      }
      await sendMessage(chip.prompt, chip.persona);
    },
    [sendMessage]
  );

  return (
    <AIContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        activeFile,
        setActiveFile,
        activeTool,
        setActiveTool,
        persona,
        setPersona,
        messages,
        isLoading,
        sendMessage,
        triggerQuickAction,
        clearChat,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return ctx;
}
