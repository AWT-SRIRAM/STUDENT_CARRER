'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { getSupabase } from '@/lib/supabase/client';

type UserRow = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
};

function AdminInner() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Not signed in.');

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { users?: UserRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load.');
      setUsers(json.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
      return;
    }
    load();
  }, [isAdmin, load, router]);

  async function onDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    if (!user) return;
    setBusyId(id);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Not signed in.');

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Delete failed.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Admin</h1>
          <p className="text-xs text-gray-500">Signed in as {profile?.username}</p>
        </div>
        <Link href="/" className="text-sm underline">
          Back to tracker
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total users</p>
          <p className="text-xl font-semibold">{users.length}</p>
        </div>
        <div className="rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Admins</p>
          <p className="text-xl font-semibold">{users.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Regular users</p>
          <p className="text-xl font-semibold">{users.filter((u) => u.role === 'user').length}</p>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-2 text-xs font-medium text-gray-500">
          USERS
        </div>
        {loading ? (
          <p className="px-4 py-3 text-sm text-gray-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No users.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <span className="font-medium">{u.username}</span>
                  {u.role === 'admin' && (
                    <span className="ml-2 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white">
                      admin
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                {u.id !== user?.id && (
                  <button
                    onClick={() => onDelete(u.id, u.username)}
                    disabled={busyId === u.id}
                    className="text-xs text-red-600 underline disabled:opacity-50"
                  >
                    {busyId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  );
}