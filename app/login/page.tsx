'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Crown, AlertCircle, Zap, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillVip = () => {
    setEmail('yash@thewebvale.com');
    setPassword('Password123!');
  };

  const handleGuestLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginGuest();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Guest login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[80vh]">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Sign In to OmniPDF
          </h1>
          <p className="text-xs text-zinc-500">
            Access your cloud workspaces, encrypted shares & AI vision studio
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={handleFillVip}
                className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
              >
                Use Yash Jain VIP
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Option */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <button
            onClick={handleGuestLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Try 1-Click Instant Guest Pro</span>
          </button>

          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-rose-500 hover:underline">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
