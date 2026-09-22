'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { validateUsername } from '@/lib/auth/username';

type Tab = 'signin' | 'signup' | 'recover';

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'signin';
  const [tab, setTab] = useState<Tab>(initialTab);

  const { signIn } = useAuth();

  // Sign in
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign up
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suStep, setSuStep] = useState<'form' | 'recovery'>('form');
  const [suRecoveryCode, setSuRecoveryCode] = useState('');
  const [suSaved, setSuSaved] = useState(false);

  // Recover
  const [rcUsername, setRcUsername] = useState('');
  const [rcCode, setRcCode] = useState('');
  const [rcNewPassword, setRcNewPassword] = useState('');
  const [rcNewCode, setRcNewCode] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    if (next !== 'signup') {
      setSuStep('form');
      setSuRecoveryCode('');
      setSuSaved(false);
    }
    if (next !== 'recover') {
      setRcNewCode(null);
    }
    router.replace(`/auth?tab=${next}`, { scroll: false });
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = validateUsername(siUsername);
    if (!u.ok) return setError(u.error);

    setBusy(true);
    try {
      await signIn(u.value, siPassword);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setBusy(false);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      const json = (await res.json()) as { recoveryCode?: string; error?: string };
      if (!res.ok || !json.recoveryCode) {
        setError(json.error ?? 'Sign up failed.');
        return;
      }
      setSuRecoveryCode(json.recoveryCode);
      setSuStep('recovery');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onSignUpContinue() {
    setBusy(true);
    try {
      await signIn(suUsername.toLowerCase(), suPassword);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setBusy(false);
    }
  }

  async function onRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = validateUsername(rcUsername);
    if (!u.ok) return setError(u.error);
    if (rcNewPassword.length < 8) return setError('New password must be at least 8 characters.');

    setBusy(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u.value,
          recoveryCode: rcCode,
          newPassword: rcNewPassword,
        }),
      });
      const json = (await res.json()) as { recoveryCode?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Recovery failed.');
        return;
      }
      setRcNewCode(json.recoveryCode ?? null);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700';

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex rounded-lg bg-gray-100 p-1 text-xs font-medium">
        {(['signin', 'signup', 'recover'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-md py-1.5 transition ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'signin' ? 'Sign in' : t === 'signup' ? 'Sign up' : 'Recover'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* SIGN IN */}
      {tab === 'signin' && (
        <form onSubmit={onSignIn} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="si-username">Username</label>
            <input
              id="si-username"
              autoComplete="username"
              value={siUsername}
              onChange={(e) => setSiUsername(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="si-password">Password</label>
            <input
              id="si-password"
              type="password"
              autoComplete="current-password"
              value={siPassword}
              onChange={(e) => setSiPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      {/* SIGN UP */}
      {tab === 'signup' && suStep === 'form' && (
        <form onSubmit={onSignUp} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="su-username">Username</label>
            <input
              id="su-username"
              autoComplete="username"
              value={suUsername}
              onChange={(e) => setSuUsername(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">Letters and numbers, 3–20 characters.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="su-password">Password</label>
            <input
              id="su-password"
              type="password"
              autoComplete="new-password"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="su-confirm">Confirm password</label>
            <input
              id="su-confirm"
              type="password"
              autoComplete="new-password"
              value={suConfirm}
              onChange={(e) => setSuConfirm(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

      {tab === 'signup' && suStep === 'recovery' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Save your recovery code</h2>
          <p className="text-sm text-gray-600">
            This is the <strong>only time</strong> this code will be shown. Store it somewhere safe.
          </p>
          <div className="rounded border border-gray-300 bg-gray-50 p-4 text-center font-mono text-base tracking-wider">
            {suRecoveryCode}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(suRecoveryCode);
              } catch {
                const ta = document.createElement('textarea');
                ta.value = suRecoveryCode;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              }
            }}
            className="w-full rounded border border-gray-300 py-2 text-sm"
          >
            Copy to clipboard
          </button>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={suSaved}
              onChange={(e) => setSuSaved(e.target.checked)}
              className="mt-0.5"
            />
            I&apos;ve saved this code somewhere safe.
          </label>
          <button
            type="button"
            disabled={!suSaved || busy}
            onClick={onSignUpContinue}
            className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </div>
      )}

      {/* RECOVER */}
      {tab === 'recover' && !rcNewCode && (
        <form onSubmit={onRecover} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="rc-username">Username</label>
            <input
              id="rc-username"
              value={rcUsername}
              onChange={(e) => setRcUsername(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="rc-code">Recovery code</label>
            <input
              id="rc-code"
              value={rcCode}
              onChange={(e) => setRcCode(e.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="rc-new">New password</label>
            <input
              id="rc-new"
              type="password"
              autoComplete="new-password"
              value={rcNewPassword}
              onChange={(e) => setRcNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      {tab === 'recover' && rcNewCode && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Password reset</h2>
          <p className="text-sm text-gray-600">
            Your old recovery code is now invalid. Save this new one — it won&apos;t be shown again.
          </p>
          <div className="rounded border border-gray-300 bg-gray-50 p-4 text-center font-mono text-base tracking-wider">
            {rcNewCode}
          </div>
          <button
            type="button"
            onClick={() => router.replace('/auth?tab=signin')}
            className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white"
          >
            Go to sign in
          </button>
        </div>
      )}

      {/* Guest */}
      <div className="border-t border-gray-200 pt-3 text-center">
        <Link href="/" className="text-xs text-gray-500 underline">
          Continue as guest
        </Link>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
      <AuthInner />
    </Suspense>
  );
}