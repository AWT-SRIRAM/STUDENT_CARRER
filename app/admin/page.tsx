'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { getSupabase } from '@/lib/supabase/client';
import { ArrowLeft, Users, Shield, User as UserIcon, Trash2, Loader2 } from 'lucide-react';

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

  const cardClass =
    'rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] p-4';

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.1] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-300" /> Admin
            </h1>
            <p className="text-xs text-gray-400">Signed in as {profile?.username}</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <div className={cardClass}>
            <p className="text-xs text-gray-400">Total users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs text-gray-400">Admins</p>
            <p className="text-2xl font-bold text-blue-300">
              {users.filter((u) => u.role === 'admin').length}
            </p>
          </div>
          <div className={cardClass}>
            <p className="text-xs text-gray-400">Regular</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === 'user').length}</p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2.5 text-xs text-red-100"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <section className={cardClass}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-300" /> Users
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-gray-500">No users.</p>
          ) : (
            <ul className="space-y-1.5">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium">{u.username}</span>
                      {u.role === 'admin' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 border border-blue-500/50 text-blue-200 font-bold uppercase">
                          admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {u.id !== user?.id && (
                    <button
                      onClick={() => onDelete(u.id, u.username)}
                      disabled={busyId === u.id}
                      className="text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50 flex items-center gap-1 transition"
                    >
                      {busyId === u.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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