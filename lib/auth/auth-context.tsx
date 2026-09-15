'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'guest';
  openAuthModal: (tab?: 'login' | 'register' | 'guest') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<AuthResponse>;
  register: (name: string, email: string, pass: string) => Promise<AuthResponse>;
  loginGuest: () => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'guest'>('login');

  // 1. Immediate client-side hydration from localStorage on mount
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem('omnipdf_user');
      const cachedToken = localStorage.getItem('omnipdf_token');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      if (cachedToken) {
        setToken(cachedToken);
      }
    } catch {}
  }, []);

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'guest' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('omnipdf_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('omnipdf_user', JSON.stringify(data.user));
        } else {
          // Only clear if server explicitly validated there is no active session
          if (!storedToken) {
            setUser(null);
            localStorage.removeItem('omnipdf_user');
            localStorage.removeItem('omnipdf_token');
          }
        }
      }
    } catch {
      // Offline fallback: keep cached localStorage state
      const cached = localStorage.getItem('omnipdf_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-verify session in background
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data: AuthResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in');
      }

      if (data.user) {
        setUser(data.user);
        const tok = data.token || null;
        setToken(tok);
        localStorage.setItem('omnipdf_user', JSON.stringify(data.user));
        if (tok) {
          localStorage.setItem('omnipdf_token', tok);
        }
      }
      closeAuthModal();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });

      const data: AuthResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register account');
      }

      if (data.user) {
        setUser(data.user);
        const tok = data.token || null;
        setToken(tok);
        localStorage.setItem('omnipdf_user', JSON.stringify(data.user));
        if (tok) {
          localStorage.setItem('omnipdf_token', tok);
        }
      }
      closeAuthModal();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const loginGuest = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
      });

      const data: AuthResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start guest session');
      }

      if (data.user) {
        setUser(data.user);
        const tok = data.token || null;
        setToken(tok);
        localStorage.setItem('omnipdf_user', JSON.stringify(data.user));
        if (tok) {
          localStorage.setItem('omnipdf_token', tok);
        }
      }
      closeAuthModal();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('omnipdf_user');
    localStorage.removeItem('omnipdf_token');
  };

  const isPro = user?.plan === 'pro' || user?.plan === 'enterprise' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isPro,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginGuest,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
