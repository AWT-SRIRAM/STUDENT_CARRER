'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { validateUsername } from '@/lib/auth/username';
import { Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

type Tab = 'signin' | 'signup';

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab: Tab = rawTab === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState<Tab>(initialTab);

  const { signIn } = useAuth();

  // Sign in
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);

  // Sign up
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPw, setSuShowPw] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setInfo(null);
    router.replace(`/auth?tab=${next}`, { scroll: false });
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const u = validateUsername(siUsername);
    if (!u.ok) return setError(u.error);

    setBusy(true);
    try {
      await signIn(u.value, siPassword);
      router.replace('/');
    } catch {
      try {
        const res = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u.value }),
        });
        const json = (await res.json()) as { exists?: boolean };

        if (!json.exists) {
          setSuUsername(u.value);
          setSuPassword('');
          setSuConfirm('');
          switchTab('signup');
          setInfo('That username is new. Create your account below.');
        } else {
          setError('Incorrect password. Try again.');
        }
      } catch {
        setError('Sign in failed. Try again.');
      }
      setBusy(false);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const u = validateUsername(suUsername);
    if (!u.ok) return setError(u.error);
    if (suPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (suPassword !== suConfirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.value, password: suPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Sign up failed.');
        setBusy(false);
        return;
      }
      await signIn(u.value, suPassword);
      router.replace('/');
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-xl border bg-white/[0.05] border-white/[0.12] text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 px-3 py-2.5 text-sm transition';
  const labelClass = 'block text-xs font-semibold text-gray-300 uppercase tracking-wider';

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex rounded-xl bg-white/[0.05] p-1 text-sm font-medium border border-white/[0.08]">
        {(['signin', 'signup'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition text-xs sm:text-sm ${
              tab === t
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'signin' && <LogIn className="w-4 h-4" />}
            {t === 'signup' && <UserPlus className="w-4 h-4" />}
            {t === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {info && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-xl border border-blue-500/40 bg-blue-500/15 px-3 py-2.5 text-xs text-blue-100"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-300" />
            <span>{info}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2.5 text-xs text-red-100"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIGN IN */}
      {tab === 'signin' && (
        <motion.form
          key="signin"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={onSignIn}
          className="space-y-4"
        >
          <div>
            <label className={labelClass} htmlFor="si-username">Username</label>
            <input
              id="si-username"
              autoComplete="username"
              value={siUsername}
              onChange={(e) => setSiUsername(e.target.value)}
              className={inputClass}
              placeholder="your username"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="si-password">Password</label>
            <div className="relative">
              <input
                id="si-password"
                type={siShowPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setSiShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200"
                tabIndex={-1}
              >
                {siShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:opacity-90 disabled:opacity-50 transition"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </motion.form>
      )}

      {/* SIGN UP */}
      {tab === 'signup' && (
        <motion.form
          key="signup"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={onSignUp}
          className="space-y-4"
        >
          <div>
            <label className={labelClass} htmlFor="su-username">Username</label>
            <input
              id="su-username"
              autoComplete="username"
              value={suUsername}
              onChange={(e) => setSuUsername(e.target.value)}
              className={inputClass}
              placeholder="e.g. Sriram007"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Letters and numbers, 3–20 characters. Shown exactly as you type it.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="su-password">Password</label>
            <div className="relative">
              <input
                id="su-password"
                type={suShowPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setSuShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200"
                tabIndex={-1}
              >
                {suShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="su-confirm">Confirm password</label>
            <input
              id="su-confirm"
              type={suShowPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={suConfirm}
              onChange={(e) => setSuConfirm(e.target.value)}
              className={inputClass}
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:opacity-90 disabled:opacity-50 transition"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </motion.form>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500 text-center py-4">Loading…</div>}>
      <AuthInner />
    </Suspense>
  );
}