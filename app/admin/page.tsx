'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { getSupabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Users,
  Shield,
  User as UserIcon,
  Trash2,
  KeyRound,
  Loader2,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import FloatingParticlesCanvas from '@/components/FloatingParticlesCanvas';

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
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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
    setError(null);
    setSuccess(null);
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
      setSuccess(`User "${username}" deleted successfully.`);
      setTimeout(() => setSuccess(null), 3000);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModalUser) return;
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setResetBusy(true);
    setResetError(null);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Not signed in.');

      const res = await fetch(`/api/admin/users/${resetModalUser.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Reset failed.');

      const username = resetModalUser.username;
      setResetModalUser(null);
      setNewPassword('');
      setSuccess(`Password for "${username}" was reset successfully.`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Password reset failed.');
    } finally {
      setResetBusy(false);
    }
  }

  if (!isAdmin) return null;

  const cardClass =
    'rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] p-4';

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      <FloatingParticlesCanvas darkMode={true} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)',
          }}
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
              <Shield className="w-4 h-4 text-blue-300" /> Admin Panel
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
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2.5 text-xs text-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

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
            <Users className="w-4 h-4 text-blue-300" /> Users Directory
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading users…
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-gray-500">No users found.</p>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-3"
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

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setResetModalUser(u);
                        setNewPassword('');
                        setResetError(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-300 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 flex items-center gap-1.5 transition"
                    >
                      <KeyRound className="w-3 h-3" />
                      Reset Password
                    </button>

                    {u.id !== user?.id && (
                      <button
                        onClick={() => onDelete(u.id, u.username)}
                        disabled={busyId === u.id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-300 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 disabled:opacity-50 flex items-center gap-1.5 transition"
                      >
                        {busyId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/[0.12] p-5 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-300">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Reset User Password</h3>
                    <p className="text-xs text-gray-400">
                      Setting new password for{' '}
                      <span className="text-white font-medium">{resetModalUser.username}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
                  {resetError}
                </div>
              )}

              <form onSubmit={onResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border bg-white/[0.05] border-white/[0.12] text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 px-3 py-2.5 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/[0.05] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetBusy || newPassword.length < 6}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20"
                  >
                    {resetBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {resetBusy ? 'Updating…' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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