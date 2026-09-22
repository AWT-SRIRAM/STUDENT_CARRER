'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateUsername } from '@/lib/auth/username';

export default function RecoverPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
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
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u.value,
          recoveryCode,
          newPassword,
        }),
      });
      const json = (await res.json()) as { recoveryCode?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Recovery failed.');
        return;
      }
      setNewRecoveryCode(json.recoveryCode ?? null);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (newRecoveryCode) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Password reset</h1>
        <p className="text-sm text-gray-600">
          Your old recovery code has been used and invalidated. Here is your new one — save it
          now, it won&apos;t be shown again.
        </p>
        <div className="rounded border border-gray-300 bg-gray-50 p-4 text-center font-mono text-base tracking-wider">
          {newRecoveryCode}
        </div>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Reset password</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="code">
          Recovery code
        </label>
        <input
          id="code"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value)}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Resetting…' : 'Reset password'}
      </button>

      <p className="text-center text-xs text-gray-600">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}