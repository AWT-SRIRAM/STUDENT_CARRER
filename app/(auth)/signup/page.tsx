'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { validateUsername } from '@/lib/auth/username';

type Step = 'form' | 'recovery';

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = validateUsername(username);
    if (!u.ok) {
      setError(u.error);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.value, password }),
      });
      const json = (await res.json()) as { recoveryCode?: string; error?: string };
      if (!res.ok || !json.recoveryCode) {
        setError(json.error ?? 'Sign up failed.');
        return;
      }
      setRecoveryCode(json.recoveryCode);
      setStep('recovery');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onContinue() {
    setBusy(true);
    try {
      await signIn(username.toLowerCase(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setBusy(false);
    }
  }

  if (step === 'recovery') {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Save your recovery code</h1>
        <p className="text-sm text-gray-600">
          This is the <strong>only time</strong> this code will be shown. Store it somewhere
          safe. It&apos;s the only way to reset your password.
        </p>

        <div className="rounded border border-gray-300 bg-gray-50 p-4 text-center font-mono text-base tracking-wider">
          {recoveryCode}
        </div>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(recoveryCode)}
          className="w-full rounded border border-gray-300 py-2 text-sm"
        >
          Copy to clipboard
        </button>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="mt-0.5"
          />
          I&apos;ve saved this code somewhere safe.
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={!saved || busy}
          onClick={onContinue}
          className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Continue'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Create account</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Letters and numbers, 3–20 characters.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Creating…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}