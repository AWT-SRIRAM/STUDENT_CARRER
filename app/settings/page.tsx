'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { getSupabase } from '@/lib/supabase/client';

function SettingsInner() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    await signOut();
    router.replace('/login');
  }

  async function onDelete() {
    if (!user || confirmText !== 'DELETE') return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Not signed in.');

      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Delete failed.');

      await signOut();
      router.replace('/signup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  if (!user || !profile) return null;

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Settings</h1>
        <Link href="/" className="text-sm underline">
          Back
        </Link>
      </header>

      <section className="space-y-2 rounded border border-gray-200 p-4">
        <p className="text-sm text-gray-700">
          Signed in as <strong>{profile.username}</strong>
        </p>
        <button
          onClick={onSignOut}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </section>

      <section className="space-y-3 rounded border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Delete account</h2>
        <p className="text-xs text-red-700">
          This permanently deletes your account, your progress, and your friendships. It cannot
          be undone.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Type DELETE to confirm'
          className="w-full rounded border border-red-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-700">{error}</p>}
        <button
          onClick={onDelete}
          disabled={confirmText !== 'DELETE' || busy}
          className="w-full rounded bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Deleting…' : 'Delete my account forever'}
        </button>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}